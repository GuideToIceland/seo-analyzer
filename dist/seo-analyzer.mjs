import t from"cli-progress";import e from"colors";import r from"express";import s from"path";import n from"cfonts";import o from"fs";import{VirtualConsole as i,JSDOM as l}from"jsdom";import a from"axios";import h from"sitemap-stream-parser";const u={titleLengthRule:function(t,e){return new Promise((r=>{const s=t.window.document.querySelector("title");s||r("This HTML is missing a <title> tag");const n=s.length;n<e.min&&r(`<title> too short(${n}). The minimum length should be ${e.min} characters.`),n>e.max&&r(`<title> too long(${n}). The maximum length should be ${e.max} characters.`),r(null)}))},imgTagWithAltAttributeRule:function(t){return new Promise((e=>{let r=0,s=0;const n=[];t.window.document.querySelectorAll("img").forEach((t=>{t.alt||r++,t.src||s++})),s>0&&n.push(`There are ${s} <img> tags without a src attribute`),r>0&&n.push(`There are ${r} <img> tags without an alt attribute`),(s||r)&&e(n),e(null)}))},aTagWithRelAttributeRule:function(t){return new Promise((e=>{let r=0;t.window.document.querySelectorAll("a").forEach((t=>{t.rel||r++})),r>0&&e(`There are ${r} <a> tags without a rel attribute`),e(null)}))},canonicalLinkRule:function(t){return new Promise((e=>{const r=t.window.document.querySelector('head > link[rel="canonical"]');r||e('This HTML is missing a <link rel="canonical" href="..."> link'),r&&!r.href&&e("The canonical link is missing an href attribute"),r&&"/"!==r.href.substr(-1)&&e("The href attribute does not have a slash at the end of the link."),e(null)}))},metaBaseRule:function(t,e={list:[]}){return new Promise((r=>{const s=[];e&&e.names&&e.names.length&&e.names.forEach((e=>{const r=t.window.document.querySelector(`head > meta[name="${e}"]`);r?r.content||s.push(`The content attribute for the <meta name="${e}" content=""> tag is empty`):s.push(`This HTML is missing a <meta name="${e}"> tag`)})),r(s)}))},metaSocialRule:function(t,e={properties:[]}){return new Promise((r=>{const s=[];e&&e.properties&&e.properties.length&&e.properties.forEach((e=>{const r=t.window.document.querySelector(`head > meta[property="${e}"]`);r?r.content||s.push(`The content attribute for the <meta property="${e}" content=""> tag is empty`):s.push(`This HTML is missing a <meta property="${e}"> tag`)})),r(s)}))}};class g{constructor(t){this.level="default"===t?2:["trace","debug","info","result","success","error"].indexOf(t)}result(t,e=!1){this.level>3&&!e||this._logResult(t)}error(t,e){this.level>5||(this._logError(t),e&&process.exit(1))}success(t){this.level>4||this._logSuccess(t)}info(t){this.level>2||this._logInfo(t)}printTextToConsole(t){if(this.level>2)return;const e=t.replace(" ","|");n.say(e,{font:"block",align:"left",colors:["system"],background:"transparent",letterSpacing:1,lineHeight:1,space:!0,maxLength:"0",gradient:!1,independentGradient:!1,transitionGradient:!1,env:"node"})}_logResult(t){if(!t.some((t=>t.report.length)))return this._logSuccess("\n👍  No SEO defects detected.\n");this._logInfo("\n🚀  Issue report");for(const e of t)this._logInfo(`\nSource: ${e.source.trim()}`),this._logError(`${e.report.join("\n")}`);return this._logSuccess("\n-------- 🚀 Finished! --------\nThanks for using Seo Analyzer!\n"),process.exit(1)}_logError(t){console.error(`${e.red(t)}`)}_logInfo(t){console.log(`${e.yellow(t)}`)}_logSuccess(t){console.log(`${e.green(t)}`)}}class c{constructor(r){this.logger=r??new g,this.consoleProgressBar=this.logger.level<=4&&new t.Bar({format:"Processing... |"+e.green("{bar}")+"| {percentage}% || {value}/{total} Pages",barCompleteChar:"█",barIncompleteChar:"░",hideCursor:!0}),this.inputUrl="",this.ignoreUrls=""}async run(t,e,r){this.inputUrl=`http://localhost:${t}`,this.ignoreUrls=e;const s=await this._getLinksFromSitemap(r);return await this._getHtmlDomFromLinks(s)}_getLinksFromSitemap(t){return this.logger.info(`🚀  Get sitemap from ${this.inputUrl}\n`),new Promise((e=>{const r=`${this.inputUrl}/${t}`,s=[];h.parseSitemaps(r,(t=>{const e=t.replace(/^.*\/\/[^/]+/,"");-1===this.ignoreUrls.indexOf(e)&&s.push(this._formatLink(t))}),(t=>{t?this.logger.error("❌  Sitemap not found\n",1):s.length?(this.logger.success("✅  Done\n"),e(s)):this.logger.error("❌  Links not found\n",1)}))}))}_formatLink(t){return t.replace(/^.*\/\/[^/]+/,this.inputUrl)}sleep(t){return new Promise((e=>setTimeout(e,t)))}async _getHtmlDomFromLinks(t){const r=[],s=[];this.logger.info("🚀  Parsing HTML\n"),this.logger.level<=4&&this.consoleProgressBar.start(t.length,0);for(const n of t)s.push(a.get(n).then((t=>{t&&200===t.status&&r.push({source:n,text:t.data})})).catch((t=>{const r=t&&t.response&&t.response.status||500;this.logger.error(`Error: ${t} - ${n}`),this.logger.error(`\n${e.yellow("==>")} ${e.white(n)} ${e.red(r)}`)})).finally((()=>{this.logger.level<=4&&this.consoleProgressBar.increment()}))),await this.sleep(500);return Promise.all(s).then((()=>(this.logger.level<=4&&this.consoleProgressBar.stop(),r)))}}class p{constructor(r){this.logger=r??new g,this.scraper=new c(this.logger),this.consoleProgressBar=this.logger.level<=4&&new t.Bar({format:"Processing... |"+e.green("{bar}")+"| {percentage}% || {value}/{total} Folders",barCompleteChar:"█",barIncompleteChar:"░",hideCursor:!0}),this.badType='The inputFiles function takes an array only ["index.html", "...", "..."]',this.emptyList='You need to pass an array to the inputFiles function ["index.html", "...", "..."]',this.ignoreFolders=[],this.ignoreFiles=[]}async files(t=[],e=[]){Array.isArray(t)&&t.length||this.logger.error('❌  The "inputFiles" method expects an array of files.\n',!0),Array.isArray(e)||this.logger.error('❌  The "ignoreFiles" method expects an array of ignore files.\n',!0),this.logger.info("\n🚀  Parsing files\n"),0===t.length&&this.logger.error(this.emptyList),Array.isArray(t)||this.logger.error(this.badType),this.ignoreFiles=e;const r=await this._getHtml(t);return await this.getDom(r)}async folders(t=[],e=[],r=[]){Array.isArray(t)&&t.length||this.logger.error('❌  The "inputFolders" method expects an array of folders.\n',!0),Array.isArray(e)||this.logger.error('❌  The "ignoreFolders" method expects an array of ignore folders.\n',!0),this.logger.info("🚀  Parsing folders\n"),this.logger.level<=4&&this.consoleProgressBar.start(t.length,0),this.ignoreFolders=e,this.ignoreFiles=r;const s=await this._getFilesFromFolders(t);return await this.files(s,r)}async spa(t,e=[],r){const s=await this.scraper.run(t,e,r);return await this.getDom(s)}async _getFilesFromFolders(t=[]){const e=[];for(const r of t){const t=await this._getFilesFromFolder(r);this.logger.level<=4&&this.consoleProgressBar.increment(),e.push(...t)}return this.logger.level<=4&&this.consoleProgressBar.stop(),e.length||this.logger.error("\n❌  No files found.\n",!0),e}_getFilesFromFolder(t=""){try{const e=o.readdirSync(t).map((e=>s.join(t,e))),r=e.filter((t=>o.statSync(t).isFile()&&".html"===s.extname(t))),n=e.filter((t=>!r.includes(t)&&o.statSync(t).isDirectory())).filter((t=>!this.ignoreFolders.includes(t))).reduce(((t,e)=>t.concat(this._getFilesFromFolder(e))),[]);return[...r,...n]}catch(e){return this.logger.error(`\n\n❌ Folder "${t}" not found\n`),[]}}_getHtml(r){const s=[],n=this.logger.level<=4&&new t.Bar({format:"Processing... |"+e.green("{bar}")+"| {percentage}% || {value}/{total} Sources",barCompleteChar:"█",barIncompleteChar:"░",hideCursor:!0});return this.logger.level<=4&&n.start(r.length,0),r.forEach((t=>{if(!this.ignoreFiles.includes(t))try{const e=o.readFileSync(t,"utf8");s.push({source:t,text:e}),this.logger.level<=4&&n.increment()}catch(e){this.logger.level<=4&&n.increment(),this.logger.error(`\n\nFile "${t}" not found\n`)}})),this.logger.level<=4&&n.stop(),s.length||this.logger.error("\n❌  No files found.\n",!0),s}getDom(r){const s=[],n=this.logger.level<=4&&new t.Bar({format:"Handling html |"+e.green("{bar}")+"| {percentage}% || {value}/{total} Sources",barCompleteChar:"█",barIncompleteChar:"░",hideCursor:!0});this.logger.info("\n🚀  Getting DOM from HTML\n"),this.logger.level<=4&&n.start(r.length,0);const o=new i;return r.forEach((t=>{let e=new l(t.text,{virtualConsole:o});s.push({source:t.source,dom:e}),this.logger.level<=4&&n.increment()})),this.logger.level<=4&&n.stop(),s}}class m{constructor(r){this.logger=r??new g,this.consoleProgressBar=this.logger.level<=4&&new t.Bar({format:"Running rules |"+e.green("{bar}")+"| {percentage}% || {value}/{total} Rules",barCompleteChar:"█",barIncompleteChar:"░",hideCursor:!0}),this.badType='The inputFiles function takes an array only ["index.html", "...", "..."]',this.emptyList='You need to pass an array to the inputFiles function ["index.html", "...", "..."]'}async run(t,e){0===t.length&&this.logger.error(this.emptyList),Array.isArray(t)||this.logger.error(this.badType);return await this._startAnalyzer(t,e)}async _startAnalyzer(t,r){const s=[];for(const n of t){this.logger.info(`\n${e.blue("==>")} Analysis ${e.white(n.source)}`);const t=await this._analyzeDOM(n.dom,r);t&&t.length&&s.push({source:n.source,report:t})}return s}async _analyzeDOM(t,e){const r=[];this.logger.level<=4&&this.consoleProgressBar.start(e.length,0);for(const s of e){let e=null;try{e=await s.rule(t,s.options)}catch(t){e=t}Array.isArray(e)?r.push(...e):e&&r.push(e),this.logger.level<=4&&this.consoleProgressBar.increment()}return this.logger.level<=4&&this.consoleProgressBar.stop(),r}}class f{constructor(t){this.analyzer=new m(t)}async object(t,e){return await this.analyzer.run(t,e)}async json(t,e){const r=await this.analyzer.run(t,e);return JSON.stringify(r,null,2)}}const d=r();class _{constructor({verbose:t=!0}){return this._logger=new g(t?"default":"error"),this._input=new p(this._logger),this._output=new f(this._logger),this._nextServer=null,this._inputData=[],this._defaultRules=u,this._rules=[],this._ignoreFolders=[],this._ignoreFiles=[],this._ignoreUrls=[],this}ignoreFiles(t){return this._ignoreFiles=t,this}ignoreFolders(t){return this._ignoreFolders=t,this}ignoreUrls(t){return this._ignoreUrls=t,this}async inputFiles(t){return 0!==this._inputData.length||(this._logger.printTextToConsole("SEO Analyzer"),this._inputData=await this._input.files(t,this._ignoreFiles)),this}async inputFolders(t){return 0!==this._inputData.length||(this._logger.printTextToConsole("SEO Analyzer"),this._inputData=await this._input.folders(t,this._ignoreFolders,this._ignoreFiles)),this}async inputSpaFolder(t,e="sitemap.xml",n=9999){return this._inputData?(this._logger.printTextToConsole("SEO Analyzer"),function(t,e){const n=new g;d.use(r.static(t)),d.get("/",((t,e)=>{e.sendFile(s.join(__dirname,"/index.html"))})),d.listen(e),n.info(`🚀  Server started on port ${e}\n`),n.success("✅  Done\n")}(t,n),this._inputData=await this._input.spa(n,this._ignoreUrls,e),this):this}async inputNextJs(t="sitemap.xml",e=3e3){if(!this._inputData)return this;if(!this._nextServer){const{default:t}=await Promise.resolve().then((function(){return y}));this._nextServer=new t(this._logger),await this._nextServer.setup()}return this._logger.printTextToConsole("SEO Analyzer"),this._inputData=await this._nextServer.inputSSR(e,this._ignoreUrls,t),this}inputHTMLStrings(t){if(0!==this._inputData.length)return this;if(!t||!t.length||t.some((t=>void 0===t.text||void 0===t.source))){const e=`Invalid input ${t}`;throw this._logger.error(e),e}return this._logger.printTextToConsole("SEO Analyzer"),this._inputData=this._input.getDom(t),this}addRule(t,e={}){return"string"==typeof t?t in u?this._rules.push({rule:u[t],options:e}):this._logger.error(`\n\n❌  Rule "${t}" not found\n`,1):"function"==typeof t?this._rules.push({rule:t,options:e}):this._logger.error("\n\n❌  Rule must be a function or a string\n",1),this}outputConsole(){return(async()=>{const t=await this._output.object(this._inputData,this._rules);this._logger.result(t,!0)})(),this}outputJson(t){return(async()=>{const e=await this._output.json(this._inputData,this._rules);t(e)})(),this}async outputJsonAsync(){return this._output.json(this._inputData,this._rules)}outputObject(t){return(async()=>{const e=await this._output.object(this._inputData,this._rules);t(e)})(),this}async outputObjectAsync(){return this._output.object(this._inputData,this._rules)}}var y=Object.freeze({__proto__:null,default:class{constructor(t){this.logger=t??new g,this._input=new p(t),this.app={},this.handle={},this.status={},this.port=parseInt(process.env.PORT,10)||3e3}async setup(){const{default:t}=await import("next");this.app=t({dev:!1}),this.handle=this.app.getRequestHandler()}run(){return new Promise(((t,e)=>{this.app.prepare().then((()=>{const e=r();e.all("*",((t,e)=>this.handle(t,e))),e.listen(this.port,(e=>{if(e)throw e;this.logger.info(`🚀  Ready on http://localhost:${this.port}\n`),t({status:"Active"})}))})).catch((t=>{this.logger.error("❌  Error Starting Server\n"),console.error(t.stack),process.exit(1),e(new Error("Error Starting Server"))}))}))}async inputSSR(t,e=[],r){this.port=t,this.status=await this.run();return this._input.spa(this.port,e,r)}}});export{_ as default};
