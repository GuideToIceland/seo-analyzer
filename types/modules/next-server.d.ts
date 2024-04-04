export default NextServer;
declare class NextServer {
    constructor(logger: any);
    logger: any;
    _input: Input;
    app: {};
    handle: {};
    status: {};
    port: number;
    setup(): Promise<void>;
    /**
     * Run Next js server
     * @returns {Promise<unknown>}
     */
    run(): Promise<unknown>;
    /**
     * Run server for next js.
     * Get the DOM from urls
     * @param {number} port
     * @param ignoreUrls
     * @returns {Promise<import('./input').ListDom>}
     */
    inputSSR(port: number, ignoreUrls: any[], sitemap: any): Promise<import('./input').ListDom>;
}
import Input from './input';
