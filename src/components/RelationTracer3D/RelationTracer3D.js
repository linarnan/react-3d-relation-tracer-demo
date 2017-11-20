import React from 'react';
import PropTypes from 'prop-types';

import { getData } from '../../api';

import './RelationTracer3D.css';

import MyForceDirect3d from './MyForceDirect3D';
import GroupBySwitcher from '../GroupBySwitcher/GroupBySwitcher';
import InfoPanel from './InfoPanel';

export default class RelationTracer3D extends React.Component {
  constructor(props) {
    super(props);
    //this.elm = null;
    this.id = props.id;

    let instance = this.instance = new MyForceDirect3d();

    //this.state {panelType, panelData}
    instance.onNodeSelectedFnArray = props.eventProxy.onNodeSelected.fn;
    instance.showInfoCallback = (type, data) => { this.panel.updatePanel(type, data) };

    this.setColoredBy = this.setColoredBy.bind(this);
    this.registerPanel = this.registerPanel.bind(this);

    if (typeof props.jsondata === 'object') {
      this.state = { dataurl: null };

      //must bind to this scope;
      props.jsondata.fn.push((d) => {
        instance.setData(d).update();
      });
    } else {//should be string
      this.state = { dataurl: props.jsondata };
    }

    this.eventProxyObj = props.eventProxyObj;
  }

  chooseNode() {

  }

  setColoredBy(t) {
    //TODO: actually shouldn't do update(), just have to change color for each node
    this.instance.setColoredBy(t).update();
  }

  registerPanel(panel) {
    this.panel = panel;
  }

  componentDidMount() {
    this.instance.init(this.elm).update();
  }

  componentWillReceiveProps(nextProps) {
    //this.instance.setData(nextProps.jsondata);
    return false;//never repaint canvas, controlled by three.js
  }

  render() {
    return (<div className="RelationTracer3D">
      <GroupBySwitcher chooseColoredBy={this.setColoredBy} />
      <div className="canvas-container" ref={elm => this.elm = elm}></div>
      <InfoPanel hookme={this.registerPanel} />
      <div className="tip">
        <div><strong>Click Node</strong> - show node information</div>
        <div><strong>Press Key: f + click Node</strong> - center the node</div>
        <div><strong>Press Key: e</strong> - edge navigation
          <ul>
            <li><strong>Mouse Click</strong> - show Link info</li>
          </ul>
        </div>
        <div><strong>Press Key: m</strong> - view only 1 hop related node (Must center a node first)</div>
        <div><strong>Mouse Wheel:</strong> - zoom in/out</div>
        <div><strong>Press Mouse Left Key + move </strong> - Drag Scene</div>
        <hr />
        <h5>TODO</h5>
        <div><strong>Press Key: b</strong> - view node within 3 hop and severity > 6 ... </div>
        <div></div>
      </div>
    </div>);
  }

  componentWillUnmount() {
    this.instance.destory();
    this.instance = null;
  }
}

RelationTracer3D.defaultProps = {
  jsondata: PropTypes.oneOfType([
    PropTypes.string, //will load this json data
    PropTypes.object  //object to hood callback fn let outside world update data
  ])
};
