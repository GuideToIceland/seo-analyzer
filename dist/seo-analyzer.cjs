(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('cli-progress'), require('colors'), require('express'), require('path'), require('cfonts'), require('fs'), require('node-html-parser'), require('axios'), require('sitemap-stream-parser')) :
  typeof define === 'function' && define.amd ? define(['cli-progress', 'colors', 'express', 'path', 'cfonts', 'fs', 'node-html-parser', 'axios', 'sitemap-stream-parser'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global["seo-analyzer"] = factory(global.cliProgress, global._colors, global.express, global.path, global.CFonts, global.fs, global["node-html-parser"], global.axios, global.sitemaps));
})(this, (function (cliProgress, _colors, express, path, CFonts, fs, nodeHtmlParser, axios, sitemaps) { 'use strict';

  function titleLengthRule(dom, options) {
    return new Promise(resolve => {
      const title = dom.querySelector('title');
      if (!title) {
        resolve('This HTML is missing a <title> tag');
      }
      // If title exists in the DOM
      const titleLength = title.textContent.length;
      if (titleLength < options.min) {
        resolve(
          `<title> too short(${titleLength}). The minimum length should be ${options.min} characters.`
        );
      }
      if (titleLength > options.max) {
        resolve(
          `<title> too long(${titleLength}). The maximum length should be ${options.max} characters.`
        );
      }
      resolve(null);
    });
  }

  function imgTagWithAltAttributeRule(dom) {
    return new Promise(resolve => {
      let countAlt = 0;
      let countSrc = 0;
      const report = [];
      const elements = dom.querySelectorAll('img');

      elements.forEach(element => {
        if (!element.attributes.alt) {
          countAlt++;
        }
        if (!element.attributes.src) {
          countSrc++;
        }
      });

      if (countSrc > 0) {
        report.push(`There are ${countSrc} <img> tags without a src attribute`);
      }

      if (countAlt > 0) {
        report.push(`There are ${countAlt} <img> tags without an alt attribute`);
      }

      if (countSrc || countAlt) {
        resolve(report);
      }

      resolve(null);
    });
  }

  function ATagWithRelAttributeRule(dom) {
    return new Promise(resolve => {
      let count = 0;
      const elements = dom.querySelectorAll('a');
      elements.forEach(element => {
        if (!element.attributes.rel) {
          count++;
        }
      });
      if (count > 0) {
        resolve(`There are ${count} <a> tags without a rel attribute`);
      }
      resolve(null);
    });
  }

  /**
   * Checks the presence and validity of the canonical link in the provided DOM.
   * @param {import('node-html-parser').HTMLElement} dom The node-html-parser object representing the HTML document.
   * @returns {Promise<string|null>} A promise that resolves with a string indicating an error message if
   * the canonical link is missing or invalid, otherwise resolves with null.
   */
  function canonicalLinkRule(dom) {
    return new Promise(resolve => {
      const element = dom.querySelector(
        'head > link[rel="canonical"]'
      );
      if (!element) {
        resolve('This HTML is missing a <link rel="canonical" href="..."> link');
      }
      if (element && !element.attributes.href) {
        resolve('The canonical link is missing an href attribute');
      }
      if (element && element.attributes.href.substr(-1) !== '/') {
        resolve(
          'The href attribute does not have a slash at the end of the link.'
        );
      }
      resolve(null);
    });
  }

  function metaBaseRule(dom, options = { list: [] }) {
    return new Promise(resolve => {
      const report = [];
      if (options && options.names && options.names.length) {
        options.names.forEach(name => {
          const element = dom.querySelector(
            `head > meta[name="${name}"]`
          );
          if (!element) {
            report.push(`This HTML is missing a <meta name="${name}"> tag`);
          } else if (!element.attributes.content) {
            report.push(
              `The content attribute for the <meta name="${name}" content=""> tag is empty`
            );
          }
        });
      }
      resolve(report);
    });
  }

  function metaSocialRule(dom, options = { properties: [] }) {
    return new Promise(resolve => {
      const report = [];
      if (options && options.properties && options.properties.length) {
        options.properties.forEach(property => {
          const element = dom.querySelector(
            `head > meta[property="${property}"]`
          );
          if (!element) {
            report.push(`This HTML is missing a <meta property="${property}"> tag`);
          } else if (!element.attributes.content) {
            report.push(
              `The content attribute for the <meta property="${property}" content=""> tag is empty`
            );
          }
        });
      }
      resolve(report);
    });
  }

  const defaultRules = {
    titleLengthRule,
    imgTagWithAltAttributeRule,
    aTagWithRelAttributeRule: ATagWithRelAttributeRule,
    canonicalLinkRule,
    metaBaseRule,
    metaSocialRule
  };

  class Logger {

    /**
     * @param {string} level
     * @returns {Logger}
     */
    constructor(level) {
      const levels = ['trace', 'debug', 'info', 'result', 'success', 'error'];
      this.level = level === 'default' ? 2 : levels.indexOf(level);
    }

    /**
     * Print formatted result to console
     * @param {Array} - Array of reports
     * @returns {Error} - Stop execution and print error
     */
    result(result, force = false) {
      if (this.level > 3 && !force) {
        return;
      }
      this._logResult(result);
    }

    /**
     * Print error message to console
     * @param {String} - Message
     * @returns {String} - Print formatted message to console
     */
    error(error, exit) {
      if (this.level > 5) {
        return;
      }
      this._logError(error);
      if (exit) process.exit(1);
    }

    /**
     * Print success message to console
     * @param {String} - Message
     * @returns {String} - Print formatted message to console
     */
    success(success) {
      if (this.level > 4) {
        return;
      }
      this._logSuccess(success);
    }

    /**
     * Print info message to console
     * @param {String} - Message
     * @returns {String} - Print formatted message to console
     */
    info(info) {
      if (this.level > 2) {
        return;
      }
      this._logInfo(info);
    }

    /**
     * Print beautiful message to console
     * @param {String} - Result message
     * @returns {String} - Print CFonts message to console
     */
    printTextToConsole(text) {
      if (this.level > 2) {
        return;
      }
      const formattedText = text.replace(' ', '|');
      CFonts.say(formattedText, {
        font: 'block', // define the font face
        align: 'left', // define text alignment
        colors: ['system'], // define all colors
        background: 'transparent', // define the background color, you can also use `backgroundColor` here as key
        letterSpacing: 1, // define letter spacing
        lineHeight: 1, // define the line height
        space: true, // define if the output text should have empty lines on top and on the bottom
        maxLength: '0', // define how many character can be on one line
        gradient: false, // define your two gradient colors
        independentGradient: false, // define if you want to recalculate the gradient for each new line
        transitionGradient: false, // define if this is a transition between colors directly
        env: 'node' // define the environment CFonts is being executed in
      });
    }

    /**
     * @param {Array} - Array of reports
     * @returns {Error} - Stop execution and print error
     * @private
     * @memberof Logger
     * @description Print result message to console
     */
    _logResult(result) {
      if (!result.some(r => r.report.length))
        return this._logSuccess('\n👍  No SEO defects detected.\n');

      this._logInfo('\n🚀  Issue report');

      for (const item of result) {
        this._logInfo(`\nSource: ${item.source.trim()}`);
        this._logError(`${item.report.join('\n')}`);
      }

      this._logSuccess(
        '\n-------- 🚀 Finished! --------\nThanks for using Seo Analyzer!\n'
      );

      return process.exit(1); // Stop process in terminal
    }

    /**
     * @param {String} - Error object
     * @returns {String} - Stop execution and print error
     * @private
     * @memberof Logger
     * @description Print error message to console
     */
    _logError(error) {
      console.error(`${_colors.red(error)}`);
    }

    /**
     * @param {String} - Error object
     * @returns {String} - Stop execution and print error
     * @private
     * @memberof Logger
     * @description Print error message to console
     */
    _logInfo(info) {
      console.log(`${_colors.yellow(info)}`);
    }

    /**
     * @param {String} - Message
     * @returns {String} - Print formatted message to console
     * @private
     * @memberof Logger
     */
    _logSuccess(success) {
      console.log(`${_colors.green(success)}`);
    }
  }

  class Scanner {
    constructor(logger) {
      this.logger = logger ?? new Logger();
      this.consoleProgressBar = this.logger.level <= 4 && new cliProgress.Bar({
        format:
          'Processing... |' +
          _colors.green('{bar}') +
          '| {percentage}% || {value}/{total} Pages',
        barCompleteChar: '\u2588',
        barIncompleteChar: '\u2591',
        hideCursor: true
      });
      this.inputUrl = '';
      this.ignoreUrls = '';
    }

    /**
     * @param {Number} port - Port for the server to listen on
     * @returns {Array} - Array of html doms
     * @description - Scrapes the site and returns the html doms
     */
    async run(port, urls, sitemap) {
      this.inputUrl = `http://localhost:${port}`;
      this.ignoreUrls = urls;
      const links = await this._getLinksFromSitemap(sitemap);
      const htmlDoms = await this._getHtmlDomFromLinks(links);
      return htmlDoms;
    }

    /**
     * Get the links from the sitemap
     * @returns {Array} - Array of links
     * @description - Scrapes the sitemap and returns the links
     */
    _getLinksFromSitemap(sitemap) {
      this.logger.info(`🚀  Get sitemap from ${this.inputUrl}\n`);
      return new Promise(resolve => {
        const formattedUrl = `${this.inputUrl}/${sitemap}`;
        const links = [];
        sitemaps.parseSitemaps(
          formattedUrl,
          link => {
            // Ignore the links that are in the ignore list
            const path = link.replace(/^.*\/\/[^/]+/, '');
            if (this.ignoreUrls.indexOf(path) === -1) {
              links.push(this._formatLink(link));
            }
          },
          err => {
            if (err) {
              this.logger.error('❌  Sitemap not found\n', 1);
            } else {
              if (!links.length) {
                this.logger.error('❌  Links not found\n', 1);
              } else {
                this.logger.success('✅  Done\n');
                resolve(links);
              }
            }
          }
        );
      });
    }

    /**
     * Formats the link to be used in axios
     * @param {String} link
     * @returns {String} - Formatted link > http://localhost:{port}/link
     */
    _formatLink(link) {
      const result = link.replace(/^.*\/\/[^/]+/, this.inputUrl);
      return result;
    }

    /**
     * Sleep for the given time in milliseconds
     * @param {Number} ms
     * @returns {Promise}
     */
    sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Get the html doms from the links
     * @param {Array} links - Array of links
     * @returns {Array} - Array of html doms
     * @description - Scrapes the links and returns the html doms
     */
    async _getHtmlDomFromLinks(links) {
      const htmlDoms = [];
      const promises = [];
      this.logger.info('🚀  Parsing HTML\n');

      // Start the progress bar
      this.logger.level <= 4 && this.consoleProgressBar.start(links.length, 0);

      for (const link of links) {
        promises.push(
          axios
            .get(link)
            .then(res => {
              if (res && res.status === 200) {
                htmlDoms.push({ source: link, text: res.data });
              }
            })
            .catch(error => {
              const err =
                (error && error.response && error.response.status) || 500;
              this.logger.error(`Error: ${error} - ${link}`);
              this.logger.error(
                `\n${_colors.yellow('==>')} ${_colors.white(link)} ${_colors.red(
                err
              )}`
              );
            })
            .finally(() => {
              this.logger.level <= 4 && this.consoleProgressBar.increment();
            })
        );
        await this.sleep(500);
      }

      return Promise.all(promises).then(() => {
        // // Stop the progress bar
        this.logger.level <= 4 && this.consoleProgressBar.stop();
        return htmlDoms;
      });
    }
  }

  /**
   * @typedef {Array<HTMLElement>} ListDom
   */

  class Input {
    constructor(logger) {
      this.logger = logger ?? new Logger();
      this.scraper = new Scanner(this.logger);
      this.consoleProgressBar = this.logger.level <= 4 && new cliProgress.Bar({
        format:
          'Processing... |' +
          _colors.green('{bar}') +
          '| {percentage}% || {value}/{total} Folders',
        barCompleteChar: '\u2588',
        barIncompleteChar: '\u2591',
        hideCursor: true
      });
      this.badType =
        'The inputFiles function takes an array only ["index.html", "...", "..."]';
      this.emptyList =
        'You need to pass an array to the inputFiles function ["index.html", "...", "..."]';
      this.ignoreFolders = [];
      this.ignoreFiles = [];
    }

    /**
     * Get the html from files
     * @param {Array<string>} files [<string>, <string>, ...]
     * @param ignoreFiles
     * @returns {Promise<ListDom>} [{ window: {}, document: {}, ... }, { window: {}, document: {}, ... }, ...]
     * @memberof Input
     */
    async files(files = [], ignoreFiles = []) {
      if (!Array.isArray(files) || !files.length)
        this.logger.error('❌  The "inputFiles" method expects an array of files.\n', true);

      if (!Array.isArray(ignoreFiles))
        this.logger.error('❌  The "ignoreFiles" method expects an array of ignore files.\n', true);

      this.logger.info('\n🚀  Parsing files\n');
      if (files.length === 0) {
        this.logger.error(this.emptyList);
      }
      if (!Array.isArray(files)) {
        this.logger.error(this.badType);
      }
      this.ignoreFiles = ignoreFiles;
      const listTexts = await this._getHtml(files);
      const listDOM = await this.getDom(listTexts);
      return listDOM;
    }

    /**
     * Get the html from files in folders
     * @param {Array<string>} folders [<string>, <string>, ...]
     * @param ignoreFolders
     * @param ignoreFiles
     * @returns {Promise<ListDom>} [{ window: {}, document: {}, ... }, { window: {}, document: {}, ... }, ...]
     * @memberof Input
     */
    async folders(folders = [], ignoreFolders = [], ignoreFiles = []) {
      if (!Array.isArray(folders) || !folders.length)
        this.logger.error('❌  The "inputFolders" method expects an array of folders.\n', true);

      if (!Array.isArray(ignoreFolders))
        this.logger.error('❌  The "ignoreFolders" method expects an array of ignore folders.\n', true);

      this.logger.info('🚀  Parsing folders\n');

      // Start the progress bar
      this.logger.level <= 4 && this.consoleProgressBar.start(folders.length, 0);
      this.ignoreFolders = ignoreFolders;
      this.ignoreFiles = ignoreFiles;

      const files = await this._getFilesFromFolders(folders);
      const listDOM = await this.files(files, ignoreFiles);
      return listDOM;
    }

    /**
     * Get the DOM from urls
     * @returns {Promise<ListDom>} [{ window: {}, document: {}, ... }, { window: {}, document: {}, ... }, ...]
     * @param port
     * @param ignoreUrls
     */
    async spa(port, ignoreUrls = [], sitemap) {
      const listTexts = await this.scraper.run(port, ignoreUrls, sitemap);
      const htmlDoms = await this.getDom(listTexts);
      return htmlDoms;
    }

    /**
     * Get all files from folders
     * @param {Array<string>} folders [<string>, <string>, ...]
     * @returns {Promise<Array<string>>} [<string>, <string>, ...]
     * @private
     * @example ['html', 'dist', 'src']
     */
    async _getFilesFromFolders(folders = []) {
      const files = [];
      for (const folder of folders) {
        const result = await this._getFilesFromFolder(folder);

        // Update the progress bar
        this.logger.level <= 4 && this.consoleProgressBar.increment();

        files.push(...result);
      }

      // Stop the progress bar
      this.logger.level <= 4 && this.consoleProgressBar.stop();

      if (!files.length) this.logger.error('\n❌  No files found.\n', true);

      return files;
    }

    /**
     * Get files from folder
     * @param {string} folder
     * @returns {Promise<Array<string>>} [<string>, <string>, ...]
     * @private
     * @memberof Input
     */
    _getFilesFromFolder(folder = '') {
      try {
        const entryPaths = fs
          .readdirSync(folder)
          .map(entry => path.join(folder, entry));
        const filePaths = entryPaths.filter(
          entryPath =>
            fs.statSync(entryPath).isFile() && path.extname(entryPath) === '.html'
        );
        const dirPaths = entryPaths.filter(
          entryPath =>
            !filePaths.includes(entryPath) && fs.statSync(entryPath).isDirectory()
        );
        const dirFiles = dirPaths
          .filter(p => !this.ignoreFolders.includes(p))
          .reduce(
            (prev, curr) => prev.concat(this._getFilesFromFolder(curr)),
            []
          );
        return [...filePaths, ...dirFiles];
      } catch (error) {
        this.logger.error(`\n\n❌ Folder "${folder}" not found\n`);
        return [];
      }
    }

    /**
     * Get the html from file
     * @param {Array<string>} files [<string>, <string>, ...]
     * @returns {Promise<Array<string>>} ['<html><body>...</body></html>', '<html><body>...</body></html>', ...]
     * @private
     * @memberof Input
     */
    _getHtml(files) {
      const listTexts = [];
      const proccess = this.logger.level <= 4 && new cliProgress.Bar({
        format:
          'Processing... |' +
          _colors.green('{bar}') +
          '| {percentage}% || {value}/{total} Sources',
        barCompleteChar: '\u2588',
        barIncompleteChar: '\u2591',
        hideCursor: true
      });

      // Start the progress bar
      this.logger.level <= 4 && proccess.start(files.length, 0);

      files.forEach(file => {
        if (this.ignoreFiles.includes(file)) return;
        try {
          const text = fs.readFileSync(file, 'utf8');
          listTexts.push({ source: file, text });
          this.logger.level <= 4 && proccess.increment();
        } catch (error) {
          this.logger.level <= 4 && proccess.increment();
          this.logger.error(`\n\nFile "${file}" not found\n`);
        }
      });
      this.logger.level <= 4 && proccess.stop();
      if (!listTexts.length) this.logger.error('\n❌  No files found.\n', true);
      return listTexts;
    }

    /**
     * Transform html to DOM
     * @param {Array<{text: string, source: string}>} list [{text: <string>, source: <string>}, {text: <string>, source: <string>}, ...]
     * @returns {Promise<ListDom>} [{ window: {}, document: {}, ... }, { window: {}, document: {}, ... }, ...]
     * @private
     */
    getDom(list) {
      const doms = [];
      const proccess = this.logger.level <= 4 && new cliProgress.Bar({
        format:
          'Handling html |' +
          _colors.green('{bar}') +
          '| {percentage}% || {value}/{total} Sources',
        barCompleteChar: '\u2588',
        barIncompleteChar: '\u2591',
        hideCursor: true
      });
      this.logger.info('\n🚀  Getting DOM from HTML\n');
      this.logger.level <= 4 && proccess.start(list.length, 0);
      list.forEach(item => {
        let dom = nodeHtmlParser.parse(item.text);
        doms.push({ source: item.source, dom });
        this.logger.level <= 4 && proccess.increment();
      });

      this.logger.level <= 4 && proccess.stop();
      return doms;
    }
  }

  /**
   * Results returned by analyzer
   * @typedef {Array<{source: string, report: string}>} AnalyzerResult
   */

  class Analyzer {
    constructor(logger) {
      this.logger = logger ?? new Logger();
      this.consoleProgressBar = this.logger.level <= 4 && new cliProgress.Bar({
        format:
          'Running rules |' +
          _colors.green('{bar}') +
          '| {percentage}% || {value}/{total} Rules',
        barCompleteChar: '\u2588',
        barIncompleteChar: '\u2591',
        hideCursor: true
      });
      this.badType =
        'The inputFiles function takes an array only ["index.html", "...", "..."]';
      this.emptyList =
        'You need to pass an array to the inputFiles function ["index.html", "...", "..."]';
    }

    /**
     * Run analyzer for a list of doms
     * @param {HTMLElement<array>} doms - The html dom list to run the rule on
     * @param {Array} rules - The rules to run
     * @returns {AnalyzerResult} - Array of error result [{ source, report }, { source, report }, { source, report }]
     */
    async run(inputData, rules) {
      if (inputData.length === 0) {
        this.logger.error(this.emptyList);
      }
      if (!Array.isArray(inputData)) {
        this.logger.error(this.badType);
      }
      const report = await this._startAnalyzer(inputData, rules);
      return report;
    }

    /**
     * @param {Array} dataList - html doms
     * @param {Array} rules - List rulers
     * @returns {AnalyzerResult} - Array of reports [{source, report}, {source, report}, {source, report}]
     */
    async _startAnalyzer(dataList, rules) {
      const result = [];
      for (const item of dataList) {
        this.logger.info(
          `\n${_colors.blue('==>')} Analysis ${_colors.white(item.source)}`
        );

        const report = await this._analyzeDOM(item.dom, rules);

        if (report && report.length) {
          result.push({
            source: item.source,
            report
          });
        }
      }

      return result;
    }

    /**
     * Run analyzer for a single dom
     * @param {*} dom - The html dom element to run the rule on
     * @param {*} rules - The rules to run
     * @returns {Array<string>} - Array of error result ['error', 'error', 'error']
     */
    async _analyzeDOM(dom, rules) {
      const result = [];
      // Start the progress bar
      this.logger.level <= 4 && this.consoleProgressBar.start(rules.length, 0);

      for (const item of rules) {
        let report = null;
        try {
          report = await item.rule(dom, item.options);
        } catch (error) {
          report = error;
        }
        if (Array.isArray(report)) {
          result.push(...report);
        } else {
          if (report) {
            result.push(report);
          }
        }

        // Update the progress bar
        this.logger.level <= 4 && this.consoleProgressBar.increment();
      }

      // Stop the progress bar
      this.logger.level <= 4 && this.consoleProgressBar.stop();

      return result;
    }
  }

  class Output {
    constructor(logger) {
      this.analyzer = new Analyzer(logger);
    }

    /**
     * @param {Array} data - List of files and folders
     * @param {Array} rules - List of rules
     * @returns {Promise} - Returns js object [{source, report}, ...]
     */
    async object(inputData, rules) {
      const report = await this.analyzer.run(inputData, rules);
      return report;
    }

    /**
     * @param {Array} data - List of files and folders
     * @param {Array} rules - List of rules
     * @returns {JSON} - Returns json [{"source", "report"}, ...]
     */
    async json(inputData, rules) {
      const report = await this.analyzer.run(inputData, rules);
      return JSON.stringify(report, null, 2);
    }
  }

  const app = express();

  /**
   * Start the server on the given port and use static files from the given path.
   * @param {String} folder - The path to the static files.
   * @param {Number} port - The port to start the server on.
   */
  function startServer(folder, port) {
    const logger = new Logger();

    app.use(express.static(folder));

    // sendFile will go here
    app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, '/index.html'));
    });

    app.listen(port);

    logger.info(`🚀  Server started on port ${port}\n`);

    logger.success('✅  Done\n');
  }

  /**
   * @typedef {import('./modules/analyzer').AnalyzerResult} AnalyzerResult
   */

  class SeoAnalyzer {
    /**
     * @param {object} options - The options object.
     * @param {boolean} [options.verbose=true] - A flag indicating whether verbose mode is enabled.
     * @returns {SeoAnalyzer}
     */
    constructor({ verbose = true }) {
      this._logger = new Logger(verbose ? 'default' : 'error');
      this._input = new Input(this._logger);
      this._output = new Output(this._logger);
      this._nextServer = null;
      this._inputData = [];
      this._defaultRules = defaultRules;
      this._rules = [];
      this._ignoreFolders = [];
      this._ignoreFiles = [];
      this._ignoreUrls = [];
      return this;
    }

    // --------- Ignore methods --------- //
    /**
     * List of files to ignore.
     * @param {Array<string>} files 
     * @returns {SeoAnalyzer}
     */
    ignoreFiles(files) {
      this._ignoreFiles = files;
      return this;
    }

    /**
     * List of directories to ignore.
     * @param {Array<string>} folders 
     * @returns {SeoAnalyzer}
     */
    ignoreFolders(folders) {
      this._ignoreFolders = folders;
      return this;
    }

    /**
     * List of urls to be ignored
     * @param {Array<string>} urls to be ignored 
     * @returns {SeoAnalyzer}
     */
    ignoreUrls(urls) {
      this._ignoreUrls = urls;
      return this;
    }

    // ------- Input methods ------- //
    /**
     * Files to analyze
     * @param {Array<string>} files 
     * @returns {Promise<SeoAnalyzer>}
     */
    async inputFiles(files) {
      if (this._inputData.length !== 0) return this;
      this._logger.printTextToConsole('SEO Analyzer');
      this._inputData = await this._input.files(files, this._ignoreFiles);
      return this;
    }

    /**
     * Directories to analyze
     * @param {Array<string>} folders 
     * @returns {Promise<SeoAnalyzer>}
     */
    async inputFolders(folders) {
      if (this._inputData.length !== 0) return this;
      this._logger.printTextToConsole('SEO Analyzer');
      this._inputData = await this._input.folders(
        folders,
        this._ignoreFolders,
        this._ignoreFiles
      );
      return this;
    }

    /**
     * Spa folder to analyze
     * @param {Array<string>} folder 
     * @returns {Promise<SeoAnalyzer>}
     */
    async inputSpaFolder(folder, sitemap='sitemap.xml', port = 9999) {
      if (!this._inputData) return this;
      this._logger.printTextToConsole('SEO Analyzer');
      // Run server for spa
      startServer(folder, port);
      this._inputData = await this._input.spa(port, this._ignoreUrls, sitemap);
      return this;
    }

    /**
     * Scan Next server
     * @param {string} sitemap Path to sitemap in xml format
     * @param {number} port Port Next server listens on
     * @returns {Promise<SeoAnalyzer>}
     */
    async inputNextJs(sitemap = 'sitemap.xml', port = 3000) {
      if (!this._inputData) return this;
      if (!this._nextServer) {
        const { default: NextServer }  = await Promise.resolve().then(function () { return nextServer; });
        this._nextServer = new NextServer(this._logger);
        await this._nextServer.setup();
      }
      this._logger.printTextToConsole('SEO Analyzer');
      this._inputData = await this._nextServer.inputSSR(port, this._ignoreUrls, sitemap);
      return this;
    }

    /**
     * Input plain HTML strings in {text, source} format to analyze
     * @param {Array<{text: string, source: string}>} inputHTMLs `text` is the plain html, `source` is an identifier such a URI
     * @returns {SeoAnalyzer}
     */
    inputHTMLStrings(inputHTMLs) {
      if (this._inputData.length !== 0) return this;
      if (!inputHTMLs || !inputHTMLs.length 
        || inputHTMLs.some(html => typeof html.text === 'undefined' || typeof html.source === 'undefined')) {
        const error = `Invalid input ${inputHTMLs}`;
        this._logger.error(error);
        throw error;
      }
      this._logger.printTextToConsole('SEO Analyzer');
      this._inputData = this._input.getDom(inputHTMLs);
      return this;
    }

    // --------- Add Rule --------- //
    /**
     * Adds a rule to the SEO analyzer.
     * @param {string|Function} rule The default rule or a custom rule function.
     * @param {object} [options={}] Additional options for the rule.
     * @returns {this} The SEO analyzer instance for method chaining.
     */
    addRule(rule, options = {}) {
      if (typeof rule === 'string') {
        if (rule in defaultRules) {
          this._rules.push({ rule: defaultRules[rule], options });
        } else {
          this._logger.error(`\n\n❌  Rule "${rule}" not found\n`, 1);
        }
      } else if (typeof rule === 'function') {
        this._rules.push({ rule, options });
      } else {
        this._logger.error('\n\n❌  Rule must be a function or a string\n', 1);
      }
      return this;
    }

    // ------- Output methods ------- //
    /**
     * Logs object to console asynchronously and returns itself
     * @returns {SeoAnalyzer}
     */
    outputConsole() {
      (async () => {
        const json = await this._output.object(this._inputData, this._rules);
        this._logger.result(json, true);
      })();
      return this;
    }

    /**
     * Returns itself and calls a callback on the output's json string
     * @param {function(string): void}
     * @returns {SeoAnalyzer}
     */
    outputJson(callback) {
      (async () => {
        const json = await this._output.json(this._inputData, this._rules);
        callback(json);
      })();
      return this;
    }

    /**
     * Returns the JSON output asynchronously
     * @returns {Promise<string>}
     */
    async outputJsonAsync() {
      return this._output.json(this._inputData, this._rules);
    }

    /**
     * Returns itself and calls a callback on the output's object
     * @param {function(AnalyzerResult): void}
     * @returns {SeoAnalyzer}
     */  
    outputObject(callback) {
      (async () => {
        const obj = await this._output.object(this._inputData, this._rules);
        callback(obj);
      })();
      return this;
    }

    /**
     * Returns the object asynchronously
     * @returns {Promise<AnalyzerResult>}
     */
    async outputObjectAsync() {
      return this._output.object(this._inputData, this._rules);
    }
  }

  class NextServer {
    constructor(logger) {
      this.logger = logger ?? new Logger();
      this._input = new Input(logger);
      this.app = {};
      this.handle = {};
      this.status = {};
      this.port = parseInt(process.env.PORT, 10) || 3000;
    }

    async setup() {
      const { default: next } = await import('next');
      this.app = next({ dev: false });
      this.handle = this.app.getRequestHandler();
    }

    /**
     * Run Next js server
     * @returns {Promise<unknown>}
     */
    run() {
      return new Promise((resolve, reject) => {
        this.app.prepare()
          .then(() => {
            const server = express();

            server.all('*', (req, res) => {
              return this.handle(req, res);
            });

            server.listen(this.port, err => {
              if (err) throw err;
              this.logger.info(`🚀  Ready on http://localhost:${this.port}\n`);
              resolve({ status: 'Active' });
            });
          })
          .catch(ex => {
            this.logger.error('❌  Error Starting Server\n');
            console.error(ex.stack);
            process.exit(1);
            reject(new Error('Error Starting Server'));
          });
      });
    }

    /**
     * Run server for next js.
     * Get the DOM from urls
     * @param {number} port
     * @param ignoreUrls
     * @returns {Promise<import('./input').ListDom>}
     */
    async inputSSR(port, ignoreUrls = [], sitemap) {
      this.port = port;
      this.status = await this.run();
      const inputResult = this._input.spa(this.port, ignoreUrls, sitemap);
      return inputResult;
    }
  }

  var nextServer = /*#__PURE__*/Object.freeze({
    __proto__: null,
    default: NextServer
  });

  return SeoAnalyzer;

}));
//# sourceMappingURL=seo-analyzer.cjs.map
