
function MyRequest(url) {
  return new Promise((resolve, reject) => {
    var request = new XMLHttpRequest();
    request.open('GET', url, true);

    request.onload = function () {
      if (request.status >= 200 && request.status < 400) {
        // Success!
        var data = JSON.parse(request.responseText);
        resolve(data);
      } else {
        // We reached our target server, but it returned an error
      }
    };

    request.onerror = function () {
      // There was a connection error of some sort
      reject();
    };

    request.send();
  });
}

function getData(datafile) {
  return MyRequest('/data/' + datafile)
    .catch(err => console.error(err));
}

function getDataList() {
  return MyRequest('/api/getDataList')
    .catch(err => console.error(err));
}

export { getData, getDataList };
