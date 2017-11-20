
//copy from demo
import { schemePaired, interpolateReds } from 'd3-scale-chromatic';
import tinyColor from 'tinycolor2';

const colorStr2Hex = str => isNaN(str) ? parseInt(tinyColor(str).toHex(), 16) : str;

const SEVERITY_COLORS = [
  interpolateReds(0.0909 * 0),
  interpolateReds(0.0909 * 0),
  interpolateReds(0.0909 * 3),
  interpolateReds(0.0909 * 3),
  interpolateReds(0.0909 * 3),
  interpolateReds(0.0909 * 6),
  interpolateReds(0.0909 * 6),
  interpolateReds(0.0909 * 6),
  interpolateReds(0.0909 * 8),
  interpolateReds(0.0909 * 8),
  interpolateReds(0.0909 * 11),
  interpolateReds(0.0909 * 11)
]

function autoColorNodes(nodes, colorByAccessor, colorField='color') {
    const colors = schemePaired; // Paired color set from color brewer
    const nodeGroups = {};

    nodes.forEach(node => { nodeGroups[colorByAccessor(node)] = null });
    Object.keys(nodeGroups).forEach((group, idx) => { nodeGroups[group] = idx });

    nodes.forEach(node => {
        node[colorField] = colors[ nodeGroups[colorByAccessor(node)] % colors.length ];
    });
}

function autoColorBySeverity(nodes, colorByAccessor, colorField='color'){
  const colors = SEVERITY_COLORS; // Paired color set from color brewer
  const nodeGroups = {};

  nodes.forEach(node => { nodeGroups[colorByAccessor(node)] = null });
  Object.keys(nodeGroups).forEach((group, idx) => { nodeGroups[group] = idx });

  nodes.forEach(node => {
      node[colorField] = colors[ nodeGroups[colorByAccessor(node)] % colors.length ];
  });
}

export { autoColorNodes, autoColorBySeverity, colorStr2Hex };
