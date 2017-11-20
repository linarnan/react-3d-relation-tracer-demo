import React from 'react';

//learn how to use state/props


export default class GroupBySwitcher extends React.Component {
  constructor(props) {
    super(props);
    this.state = { cid: { checked: true }, severity: { checked: false } };

    this.setColoredBy = props.chooseColoredBy;
    this.onCIDSelect = this.onCIDSelect.bind(this);
    this.onSeveritySelect = this.onSeveritySelect.bind(this);
  }

  onCIDSelect() {
    this.setState({ cid: { checked: true }, severity: { checked: false } });
    this.setColoredBy('cid');
  }

  onSeveritySelect() {
    //console.log("Parent get notify - severity");
    this.setState({ cid: { checked: false }, severity: { checked: true } });
    this.setColoredBy('severity');
  }

  render() {
    //console.log(this.state);
    return (<div className="groupby">
      Colored By: &nbsp;&nbsp;
      <OptionCid choosed={this.state.cid} onChoosed={this.onCIDSelect} />
      &nbsp;&nbsp;&nbsp;
      <OptionSeverity choosed={this.state.severity} onChoosed={this.onSeveritySelect} />
    </div>);
  }
}

GroupBySwitcher.defaultProps = {

};

//option cid

class OptionCid extends React.Component {
  constructor(props) {
    super(props);
    this.onChoosed = props.onChoosed;
    this.state = props.choosed;
    this.selected = this.selected.bind(this);
  }

  selected() {
    this.onChoosed();
  }


  componentWillReceiveProps(nextProps) {
    //console.log(nextProps, "componentWillReceiveProps - cid");
    this.setState(nextProps.choosed);
    return true;
  }


  render() {
    //console.log("render cid");
    return (<span>
      <label htmlFor="cid">cid</label>
      <input id="cid" name="groupby" type='radio' value='cid' checked={this.state.checked} onChange={this.selected} />
    </span>);
  }
}


class OptionSeverity extends React.Component {
  constructor(props) {
    super(props);

    this.onChoosed = props.onChoosed;
    this.state = props.choosed;
    this.selected = this.selected.bind(this);
  }

  selected() {
    this.onChoosed();
  }

  componentWillReceiveProps(nextProps) {
    //console.log(nextProps, "componentWillReceiveProps - severity");
    this.setState(nextProps.choosed);
    return true;
  }

  render() {
    //console.log("render severity ", this.state);
    return (<span>
      <label htmlFor="severity">severity</label>
      <input id="severity" name="groupby" type='radio' value='Severity' checked={this.state.checked} onChange={this.selected} />
    </span>);
  }
}
