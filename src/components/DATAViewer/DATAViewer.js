import React from 'react';

import './DATAViewer.css';
export default class DATAViewer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      node_selected: null,
      nodes: [],
      edges: [],
    };
    props.eventProxy.onNodeSelected.fn.push(this.nodeSelected.bind(this));
    props.jsondata.fn.push(this.dataUpdated.bind(this));
    this.nodesDOMElm = {};
  }

  dataUpdated(data) {
    this.edges_all = data.edges;
    this.setState({ node_selected: null, nodes: data.nodes, edges: data.edges });
  }

  nodeSelected(node) {
    var edges = _.filter(this.edges_all, e => e.from === node.id || e.to === node.id);

    //console.log(this.edges_all.length, edges.length);
    this.setState({
      node_selected: node,
      nodes: this.state.nodes,
      edges: edges
    });
  }

  showNodes() {
    var ns = this.state.nodes
    var selectedNode = this.state.node_selected;
    var len = ns.length;
    var selected = false;
    var result = [];
    for (let i = 0; i < len; i++) {
      result.push(this.nodeHTML(ns[i], selectedNode ? selectedNode.id === ns[i].id : false));
    }
    return result;
  }

  showEdges() {
    var ns = this.state.edges
    var len = ns.length;
    var result = [];
    for (let i = 0; i < len; i++) {
      result.push(this.edgeHTML(ns[i]));
    }
    return result;
  }

  onNodeClick() {
    //TODO:
  }

  nodeHTML(node, selected) {
    var _selected = selected ? ' selected' : '';
    return (<div ref={elm => this.nodesDOMElm[node.id] = elm} className={`item node${_selected}`} key={node.id} onClick={this.onNodeClick}>{node.label}</div>);
  }

  edgeHTML(edge) {
    return (<div className="item edge" key={edge.id}>{edge.label}</div>);
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.state.node_selected) {
      var DOMNode = this.nodesDOMElm[this.state.node_selected.id];
      if (DOMNode) {
        DOMNode.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }

  componentWillUnmount() {
    this.nodesDOM = null;
  }

  render() {
    return (
      <div className="rightbar">
        <div className="nodes">
          <h3>Show nodes</h3>
          <div className="content" ref={elm => this.node_container = elm}>
            {this.showNodes()}
          </div>
        </div>
        <div className="edges">
          <h3>Show edges of clicked node</h3>
          <div className="content">
            {this.showEdges()}
          </div>
        </div>
      </div>);
  }
}
