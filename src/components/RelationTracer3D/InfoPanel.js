import React from 'react';
import PropTypes from 'prop-types';

import './RelationTracer3D.css';

export default class InfoPanel extends React.Component {
  constructor(props) {
    super(props);
    this.elm = null;
    this.state = { type: '', data: {} };
    //let parent get this instance
    props.hookme(this);

    this.updatePanel = this.updatePanel.bind(this);
  }

  updatePanel(type, data) {
    this.setState({ type: type, data: data });
  }

  nodeHTML() {
    return (
      <table className="info-table">
        <caption><strong>Node:</strong>{this.state.data.label}</caption>
        <tbody>
          <tr><th>cid</th><td>{this.state.data.cid}</td></tr>
          <tr><th>severity</th><td>{this.state.data.severity}</td></tr>
          <tr><th>org</th><td>{this.state.data.org}</td></tr>
          <tr><th>com</th><td>{this.state.data.com}</td></tr>
        </tbody>
      </table >
    );
  }

  edgeHTML() {
    return (
      <table className="info-table">
        <caption><strong>Edge:</strong> {this.state.data.label}</caption>
        <tbody>
          <tr><th>from</th><td>{this.state.data.from}</td></tr>
          <tr><th>to</th><td>{this.state.data.to}</td></tr>
          <tr><th>id</th><td>{this.state.data.id}</td></tr>
          <tr><th>severity</th><td>{this.state.data.severity}</td></tr>
        </tbody>
      </table>
    );
  }

  render() {
    return (<div className="info-panel">{this.state.type === 'node' ? this.nodeHTML() : (this.state.type === 'edge' ? this.edgeHTML() : '')}</div>);
  }
}
