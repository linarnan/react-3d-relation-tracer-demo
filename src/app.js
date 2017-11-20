import React from 'react';
import ReactDOM from 'react-dom';

import './css/index.css';
//api
import { getData } from './api';

//Component
import RelationTracer3D from './components/RelationTracer3D/RelationTracer3D';
import DATAList from './components/DATAList/DATAList';
import DATAViewer from './components/DATAViewer/DATAViewer';


class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      currentDataURL: '/graph.json',
      proxyUpdate: {
        fn: []
      },
      eventProxyObj: {
        onNodeSelected: {
          fn: []
        }
      }
    };

    this.dataChoose = this.dataChoose.bind(this);
  }

  dataChoose(data) {
    let fn = this.state.proxyUpdate.fn || [];
    fn.forEach(f => f(data)); //pass data to each component
  }

  // componentWillMount(){
  //   getData(this.state.currentDataURL)
  //   .then();
  // }


  render() {
    return (
      <div className="mainContent">
        <DATAList dataChoosed={this.dataChoose} initDataURL='graph.json' />
        <RelationTracer3D jsondata={this.state.proxyUpdate} eventProxy={this.state.eventProxyObj} />
        <DATAViewer jsondata={this.state.proxyUpdate} eventProxy={this.state.eventProxyObj} />
      </div>
    );
  }
}

ReactDOM.render(<App />, document.getElementById('app'));
