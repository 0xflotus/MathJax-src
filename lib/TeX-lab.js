import {TeX} from '../mathjax3/input/tex.js';
import {CHTML} from '../mathjax3/output/chtml.js';
import {HTMLMathItem} from '../mathjax3/handlers/html/HTMLMathItem.js';
import {HTMLDocument} from '../mathjax3/handlers/html/HTMLDocument.js';
import {handleRetriesFor} from '../mathjax3/util/Retries.js';
import {browserAdaptor} from '../mathjax3/adaptors/browserAdaptor.js';

import {ConfigurationHandler} from '../mathjax3/input/tex/Configuration.js';
import '../mathjax3/input/tex/base/BaseConfiguration.js';
import '../mathjax3/input/tex/ams/AmsConfiguration.js';
import '../mathjax3/input/tex/noundefined/NoUndefinedConfiguration.js';
import '../mathjax3/input/tex/boldsymbol/BoldsymbolConfiguration.js';

const chtml = new CHTML();
const adaptor = browserAdaptor();
const doc = new HTMLDocument(document, adaptor, {OutputJax: chtml});
document.head.appendChild(chtml.styleSheet(doc));

const Lab = window.Lab = {
  doc: doc,
  TeX: null,
  tex: document.getElementById('tex'),
  output: document.getElementById('output'),
  display: true,
  packages: {},
  
  Typeset() {
    this.output.innerHTML = '';
    let text = this.output.appendChild(document.createTextNode(''));

    let LaTeX = this.tex.value;
    let math = new HTMLMathItem(LaTeX, this.TeX, this.display);
    math.setMetrics(16, 8, 16*20, 100000, 1);
    math.start = {node: text, n: 0, delim: ''};
    math.end = {node: text, n: 0, delim: ''};
    this.jax = math;

    handleRetriesFor(function () {
      math.compile();
      math.typeset(this.doc);
      math.updateDocument(this.doc);  
    }.bind(this)).catch(err => {console.log('Error: '+err.message); console.log(err.stack)});
  },
  
  Keep() {
    const flags = this.getPackageFlags();
    window.location.search = '?' + (this.display ? 1 : 0) + flags + encodeURIComponent(this.tex.value);
  },

  getPackageFlags() {
    const keys = Object.keys(this.packages);
    return keys.map(key => document.getElementById(this.packages[key]).checked ? 1 : 0).join('');
  },
  
  getPackages() {
    let result = [];
    for (let key in this.packages) {//  Object.keys(this.packages)) {
      if (document.getElementById(this.packages[key]).checked) {
        result.push(key);
      }
    }
    return result;
  },
  
  Packages() {
    let div = document.getElementById('package');
    ConfigurationHandler.getInstance();
    for (let key of ConfigurationHandler.getInstance().keys()) {
      if (key === 'empty') continue;
      let checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.name = key;
      checkbox.value = key;
      checkbox.id = 'package-' + key;
      checkbox.onchange = function () {Lab.newPackages()};
      if (key === 'base') checkbox.checked = true;
      let label = document.createElement('label');
      label.htmlFor = 'package-' + key;
      label.appendChild(document.createTextNode(key[0].toUpperCase() + key.slice(1)));
      checkbox.appendChild(label);
      div.appendChild(checkbox);
      div.appendChild(label);
      this.packages[key] = 'package-' + key;
    }
  },

  newPackages() {
    this.TeX = new TeX({packages: this.getPackages()});
    this.doc = new HTMLDocument(document, adaptor, {InputJax: this.TeX, OutputJax: chtml});
    Lab.Typeset();
  },
  
  setDisplay(checked) {
    this.display = checked;
    this.Typeset();
  },
  
  checkKey: function (textarea, event) {
    if (!event) event = window.event;
    var code = event.which || event.keyCode;
    if ((event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) &&
        (code === 13 || code === 10)) {
      if (event.preventDefault) event.preventDefault();
      event.returnValue = false;
      this.Typeset();
    }
  }

}

Lab.Packages();

if (window.location.search !== '') {
  const n = Lab.getPackageFlags().length;
  Lab.tex.value = decodeURIComponent(window.location.search.substr(n + 2));
  Lab.display = window.location.search.substr(1,1) === '1';
  document.getElementById('display').checked = Lab.display;
  const flags = window.location.search.substr(2,n); 
  let i = 0;
  for (const key in Lab.packages) {
    if (flags.charAt(i++) === '1') {
      document.getElementById(Lab.packages[key]).checked = true;
    }
  }
}

Lab.newPackages();  
