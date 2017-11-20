import React from 'react';

import FileInput from 'react-fine-uploader/file-input'
import FineUploaderTraditional from 'fine-uploader-wrappers'

import './DATAList.css';
import { getData, getDataList } from '../../api';

const uploader = new FineUploaderTraditional({
  options: {
    request: {
      endpoint: '/upload-json'
    }
  }
})

export default class DTATList extends React.Component {
  constructor(props) {
    super(props);
    this.dataChoosed = props.dataChoosed;
    this.state = { initDataURL: props.initDataURL, files: [] };
    this.elm = null;
    this.clickFile = this.clickFile.bind(this);

    this.getDataList();
    this.loadData();
  }

  loadData() {
    getData(this.state.initDataURL)
      .then(data => {
        this.dataChoosed(data);
      })
      .catch(err => console.error(err));
  }

  clickFile(e, name) {
    e.preventDefault();
    //console.log('The file was clicked.', name, e);
    this.state.initDataURL = name;
    this.loadData();
    this.setState({ initDataURL: name, files: this.state.files })
  }

  listFiles() {
    let files = this.state.files || [];
    let len = files.length;
    let content = []
    for (let i = 0; i < len; i++) {
      content.push(this.fileRow(files[i]));
    }
    return content;
  }

  getDataList() {
    getDataList()
      .then(data => {
        let initDataURL = this.state.initDataURL;
        if (data && data[0] && !initDataURL) {
          initDataURL = data[0];
        }
        //console.log(data);
        this.setState({ initDataURL: initDataURL, files: data || [] })
      })
      .catch(err => console.error("getDataList fail"))
  }

  fileRow(name) {
    //key for loop
    return (<div className={`file ${this.state.initDataURL === name ? 'selected' : ''}`} key={name} onClick={e => this.clickFile(e, name)}>{name}</div>);
  }

  render() {
    return (<div id={this.id} className="data-uploader" ref={elm => this.elm = elm}>
      <div className="fileuploader">
        <FileInput accept='json/*' uploader={uploader}>
          <span className="icon ion-upload">Upload *.json</span>
        </FileInput>
      </div>
      {this.listFiles()}
    </div>);
  }
}
