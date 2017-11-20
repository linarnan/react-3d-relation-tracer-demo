import * as THREE from 'three';
import _ from 'lodash';
import trackballControls from 'three-trackballcontrols';
import accessorFn from 'accessor-fn';

import * as d3 from 'd3-force-3d';
import ngraph from 'ngraph.graph';
import forcelayout3d from 'ngraph.forcelayout3d';

import { DEBUG_MSG } from '../../util/debug';

import { autoColorNodes, colorStr2Hex, autoColorBySeverity } from './color-utils';

const CAMERA_DISTANCE2NODES_FACTOR = 110;

//TODO: Material should move into MyForceDirectObject prevent object always not free when component destroyed, this is only for demo ;
const FOCUSED_NODE_MATERIAL = new THREE.MeshPhongMaterial({ color: 0xc0c0c0, specular: 0xdcdcdc, shininess: 30, flatShading: THREE.SmoothShading });

const hoveredlineMaterial = new THREE.LineBasicMaterial({
  color: '#ffffa3',
  transparent: false,
  opacity: 0.5
});

const lineMaterial = new THREE.LineBasicMaterial({
  color: '#f0f0f0',
  transparent: true,
  opacity: 0.2
});

export default class MyForceDirected3d {

  constructor(elm, data) {
    DEBUG_MSG("MyForceDirected3d init");
    this.isInitialized = false;
  }

  init(elm, data) {

    this.elm = elm;

    this.width = elm.clientWidth || window.innerWidth;
    this.height = Math.max(600, elm.clientHeight, window.innerHeight / 2);

    this.nodeRelSize = 6;
    this.nodeResolution = 16;

    this.lineOpacity = 0.25

    this.cooldownTime = 10 * 1000;
    this.cooldownTick = 200;


    this.focusNodeSphereObj = null;
    this.clickedObj = null;

    // Setup tooltip
    const focusNode = this.focusNodeTitleElm = document.createElement('div');
    focusNode.classList.add('focus-node-title');
    this.elm.appendChild(focusNode);

    const hoverNode = this.hoverNodeTitleElm = document.createElement('div');
    hoverNode.classList.add('mouseover-object');
    this.elm.appendChild(hoverNode);

    const hoverPanel = this.hoverNodeTitleElm = document.createElement('div');
    hoverPanel.classList.add('mouseover-panel');
    this.elm.appendChild(hoverPanel);

    //default grouping key
    this.coloredBy = 'cid';

    //key press mode
    this.EDGE_MODE = false;
    this.FOCUS_MODE = false;
    this.DRAG_MODE = false;
    this.TRACE_MODE = false;

    this._init(elm);

    this._bind_event();

    if (data) {
      this.setData(data);
    }
    this.isInitialized = true;


    this.hoverObjecgtFn = _.throttle((x, y) => {
      //DEBUG_MSG(x, y);
      var obj = null;
      var labelDIV = hoverNode;
      if (this.EDGE_MODE) {
        if (!this.DRAG_MODE) {
          obj = this._checkIntersects('Line');
        }
      } else {
        obj = this._checkIntersects('Mesh');
      }

      if (obj && obj.__data) {
        labelDIV.innerText = obj.__data.label || '';
        labelDIV.style.left = x + 'px';
        labelDIV.style.top = y + 'px';
        if (this.EDGE_MODE && !this.DRAG_MODE) {
          //reverted when leaving edge mode
          obj.material = hoveredlineMaterial;
        }
      } else {
        labelDIV.innerText = '';
        labelDIV.style.left = 0;
        labelDIV.style.top = 0;
      }
    }, 120);

    return this;
  }

  /**
   * have to call upate() manually
   * 
   * @param {any} data 
   * @returns 
   * @memberof MyForceDirected3d
   */
  setData(data) {
    this.graphData = data;
    return this;
  }

  setColoredBy(type) {
    this.coloredBy = type;
    return this;
  }

  onClick(type, data, object) {
    //object.visible = false
    //DEBUG_MSG("onClick", e, data, object.type, object);
    this.showInfoCallback(type, data);
    if (this.onNodeSelectedFnArray && _.isArray(this.onNodeSelectedFnArray)) {
      this.onNodeSelectedFnArray.forEach(f => f && f(data));
    }
  }


  onMousemove(e) {

  }

  _bind_event() {
    var graph = this.elm;
    this.onClick && graph.addEventListener('click', this._onClick.bind(this));
    this.onMousemove && graph.addEventListener('mousemove', this._onMousemove.bind(this));
    //use passive mode here, https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#Multiple_identical_event_listeners
    //prevent multiple add problem (mousedown event used by Control)
    graph.addEventListener('mousedown', this._onMouseDown.bind(this), 'passive');

    graph.addEventListener('mouseup', this._onMouseUp.bind(this));

    this.KEYDOWN = this._keydown.bind(this);
    this.KEYUP = this._keyup.bind(this);
    window.addEventListener('keydown', this.KEYDOWN, false);
    window.addEventListener('keyup', this.KEYUP, false);
  }

  _onClick(e) {
    if (this.EDGE_MODE) {
      const edge = this._checkIntersects('Line');
      if (!edge) {
        return;
      }

      this.onClick('edge', edge.__data, edge);
    } else {
      const firstSphere = this._checkIntersects('Mesh');
      if (!firstSphere) {//no Node found
        return null;
      }
      if (this.FOCUS_MODE) {
        if (this.focusNodeSphereObj) {//swap previous back
          this.focusNodeSphereObj.material = this.focusNodeMaterialOriginal;
        }
        this.focusNodeMaterialOriginal = firstSphere.material;
        firstSphere.material = FOCUSED_NODE_MATERIAL;
        //console.log(firstSphere.material);
        this.focusNodeSphereObj = firstSphere;

        //focus node title
        this.focusNodeTitleElm.innerText = firstSphere.__data.label;
        //light focus
        this.balancedLight.target = firstSphere;
        this.focusPoint(firstSphere.position);
      }
      this.onClick('node', firstSphere.__data, firstSphere);
    }
  }

  _onMousemove(e) {
    // update the mouse pos
    const offset = getOffset(this.elm),
      relPos = {
        x: e.pageX - offset.left,
        y: e.pageY - offset.top
      };
    this.mousePos.x = (relPos.x / this.width) * 2 - 1;
    this.mousePos.y = -(relPos.y / this.height) * 2 + 1;

    function getOffset(el) {
      const rect = el.getBoundingClientRect(),
        scrollLeft = window.pageXOffset || document.documentElement.scrollLeft,
        scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      return { top: rect.top + scrollTop, left: rect.left + scrollLeft };
    }

    //TODO: should skip when mouse drag
    if (!this.DRAG_MODE) {
      this.hoverObjecgtFn(relPos.x - 20, relPos.y - 40);
    }
  }

  _onMouseDown() {
    this.DRAG_MODE = true;
  }

  _onMouseUp() {
    this.DRAG_MODE = false;
  }
  _onZoomChange(ev) {

  }



  _keydown(e) {
    window.removeEventListener('keydown', this.KEYDOWN);
    if (e.key === 'f') {
      this.FOCUS_MODE = true;
      this.EDGE_MODE = false;
      this.TRACE_MODE = false;
    } else if (e.key === 'e') {
      this.FOCUS_MODE = false;
      this.EDGE_MODE = true;
      this.TRACE_MODE = false;
    } else if (e.key === 'm') {
      this.FOCUS_MODE = false;
      this.EDGE_MODE = false;
      this.TRACE_MODE = true;
      this._traceMode();
    } else {

    }
    //DEBUG_MSG(e);
  }

  _keyup(e) {
    if (this.EDGE_MODE) {
      this._resetEdgeMode();
    }
    if (this.TRACE_MODE) {
      this._resetTraceMode();
    }
    this.FOCUS_MODE = false;
    this.EDGE_MODE = false;

    window.addEventListener('keydown', this.KEYDOWN, false);
  }

  /**
    * 
    * 
    * @param {any} OBJ 
    * @returns THREE.Object || null
    * @memberof MyForceDirected3d
    */
  _checkIntersects(OBJ) {

    this.raycaster.setFromCamera(this.mousePos, this.camera);
    const intersects = this.raycaster.intersectObjects(this.graphScene.children);


    if (!intersects.length) {
      return null;
    }

    //console.log(intersects);

    const elm = _.find(intersects, s => s.object.type === OBJ);

    if (elm && elm.object) {
      return elm.object; //Mesh || Line
    } else {
      return null;
    }
  }

  _traceMode() {
    if (!this.focusNodeSphereObj) {
      return;
    }
    var center = this.focusNodeSphereObj;
    var centerNodeId = this.focusNodeSphereObj.__data.id;

    var nodes = this.graphData.nodes;
    var edges = this.graphData.edges;

    var node_maps = _.keyBy(nodes, 'id');
    var filter = [center];
    var from = _.reduce(edges, (result, v) => {
      if (v.from === centerNodeId) {
        result.push(node_maps[v.to].__sphere);
        result.push(v.__line)
      }
      return result;
    }, filter);

    var to = _.reduce(edges, (result, v) => {
      if (v.to === centerNodeId) {
        result.push(node_maps[v.from].__sphere);
        result.push(v.__line)
      }
      return result
    }, filter);




    this.graphScene.children.forEach(v => {
      if (filter.indexOf(v) === -1) {
        v.visible = false;
      }
    });



  }

  _resetTraceMode() {
    if (!this.focusNodeSphereObj) {
      return;
    }
    this.graphScene.children.forEach(v => {
      v.visible = true;
    });
  }

  _resetEdgeMode() {
    this.graphData.edges.forEach(e => {
      e.__line.material = lineMaterial;
    })
  }

  /**
   * init Graph 
   * 
   * @memberof MyForceDirected3d
   */
  _init(elm) {
    // Setup renderer
    this.renderer = new THREE.WebGLRenderer();

    //append canvas
    elm.appendChild(this.renderer.domElement);

    // Capture mouse coords on move
    const raycaster = this.raycaster = new THREE.Raycaster();
    this.mousePos = new THREE.Vector2();
    this.mousePos.x = -2; // Initialize off canvas
    this.mousePos.y = -2;

    // Setup scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000011);
    scene.add(this.graphScene = new THREE.Group());

    // Add lights
    scene.add(new THREE.AmbientLight(0xebebeb, 0.8));
    scene.add(new THREE.DirectionalLight(0xececec, 0.5));
    this.balancedLight = new THREE.DirectionalLight(0xececec, 0.1);
    this.balancedLight.position.set(0, 0, -1);


    scene.add(this.balancedLight);
    // Setup camera
    this.camera = new THREE.PerspectiveCamera();
    this.camera.far = 17000;



    // Add camera interaction
    const tbControls = this.control = new trackballControls(this.camera, this.renderer.domElement);
    this.control.noPan = true;
    const animate = () => {
      if (this.onFrame) {
        this.onFrame();
      }

      raycaster.setFromCamera(this.mousePos, this.camera);
      //const intersects = raycaster.intersectObjects(this.graphScene.children);
      //console.log(intersects[0] && intersects[0].object);
      // Frame cycle
      tbControls.update();
      this.renderer.render(scene, this.camera);
      requestAnimationFrame(animate);
    }
    animate();
    DEBUG_MSG("End of _init");
  }

  focusPoint(position) {
    this.control.target = position;
  }

  update() {
    if (!this.isInitialized || !this.graphData) {
      return;
    }

    this.__resizeCanvas();

    this.onFrame = null; // Pause simulation

    let nodes = this.graphData.nodes;
    let edges = this.graphData.edges;

    // Auto add color to uncolored nodes
    // TODO should use more color scale
    if (this.coloredBy === 'severity') {
      autoColorBySeverity(nodes, accessorFn('severity'));
    } else {
      autoColorNodes(nodes, accessorFn('cid'));
    }

    let node_stats = _.countBy(nodes, 'cid');
    let nodes_idx = _.keyBy(nodes, 'cid');

    let cid_r = {};
    //TODO: move to outer class
    //determine group sphere volume size
    _.each(node_stats, (v, cid) => {
      //console.log(v, cid);
      if (v > 100) {
        cid_r[cid] = 6;
      } else if (v > 60 && v < 100) {
        cid_r[cid] = 8;
      } else if (v > 20 && v < 60) {
        cid_r[cid] = 10;
      } else if (v > 5 && v < 20) {
        cid_r[cid] = 13;
      } else {
        cid_r[cid] = 18;
      }
    });


    // Add WebGL objects
    while (this.graphScene.children.length) {
      this.graphScene.remove(this.graphScene.children[0])
    } // Clear the place

    const nameAccessor = accessorFn('id');//TODO: replace it
    const valAccessor = accessorFn('cid');//TODO:replace it 
    const colorAccessor = accessorFn('color');//TODO:replace it 
    let sphereGeometries = {}; // indexed by node value
    let sphereMaterials = {}; // indexed by color


    //create Nodes
    nodes.forEach(node => {
      var radius = cid_r[node.cid];

      //console.log(val);
      if (!sphereGeometries.hasOwnProperty(radius)) {
        //var Math.cbrt(val) * this.nodeRelSize
        sphereGeometries[radius] = new THREE.SphereGeometry(radius, this.nodeResolution, this.nodeResolution);
      }

      const color = colorAccessor(node);
      if (!sphereMaterials.hasOwnProperty(color)) {
        sphereMaterials[color] = new THREE.MeshLambertMaterial({
          color: colorStr2Hex(color || '#ffffaa'),
          transparent: true,
          opacity: 0.8
        });
      }

      const sphere = new THREE.Mesh(sphereGeometries[radius], sphereMaterials[color]);

      sphere.name = nameAccessor(node); // Add label
      sphere.__data = node; // Attach node data
      this.graphScene.add(node.__sphere = sphere);
    });



    //create Links
    edges.forEach(link => {
      //const color = linkColorAccessor(link);
      const geometry = new THREE.BufferGeometry();
      geometry.addAttribute('position', new THREE.BufferAttribute(new Float32Array(2 * 3), 3));
      const line = new THREE.Line(geometry, lineMaterial);

      // Prevent visual glitches of dark lines on top of spheres by rendering them last
      line.renderOrder = 10;
      line.__data = link;
      this.graphScene.add(link.__line = line);
    });

    if (this.camera.position.x === 0 && this.camera.position.y === 0) {
      // If camera still in default position (not user modified)
      this.camera.lookAt(this.graphScene.position);
      this.camera.position.z = Math.cbrt(nodes.length) * CAMERA_DISTANCE2NODES_FACTOR;
    }

    // ngraph, 3d layout
    const graph = ngraph();
    nodes.forEach(node => { graph.addNode(node.id); });
    edges.forEach(link => { graph.addLink(link.from, link.to); });
    let layout = forcelayout3d(graph);
    layout.graph = graph; // Attach graph reference to layout

    for (let i = 0; i < this.warmupTicks; i++) { layout['step'](); } // Initial ticks before starting to render

    let cntTicks = 0;
    const startTickTime = new Date();

    const layoutTick = () => {

      if (cntTicks++ > this.cooldownTicks || (new Date()) - startTickTime > this.cooldownTime) {
        this.onFrame = null; // Stop ticking graph
      }

      layout['step'](); // Tick it

      // Update nodes position
      this.graphData.nodes.forEach(node => {
        const sphere = node.__sphere;
        if (!sphere) return;

        const pos = layout.getNodePosition(node.id);

        sphere.position.x = pos.x;
        sphere.position.y = pos.y || 0;
        sphere.position.z = pos.z || 0;
      });

      //skip link update at begin, increase performance 
      if (cntTicks < 40) {
        return;
      }

      // Update links position
      edges.forEach(link => {
        const line = link.__line;
        if (!line) return;

        const pos = layout.getLinkPosition(layout.graph.getLink(link.from, link.to).id),
          start = pos['from'],
          end = pos['to'],
          linePos = line.geometry.attributes.position;

        linePos.array[0] = start.x;
        linePos.array[1] = start.y || 0;
        linePos.array[2] = start.z || 0;
        linePos.array[3] = end.x;
        linePos.array[4] = end.y || 0;
        linePos.array[5] = end.z || 0;

        linePos.needsUpdate = true;
        line.geometry.computeBoundingSphere();
      });
    }

    this.onFrame = layoutTick;
  }

  destory() {
    this.raycaster = null;
    this.secen = null;
    this.renderer = null;
    this.camera = null;
  }

  __resizeCanvas() {
    if (this.width && this.height) {
      this.renderer.setSize(this.width, this.height);
      this.camera.aspect = this.width / this.height;
      this.camera.updateProjectionMatrix();
    }
  }



}

