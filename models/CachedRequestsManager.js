import * as utilities from "../utilities.js";
import { log } from "../log.js";

class CachedRequest {
    constructor(url, content, ETag){
        this.url = url;
        this.content = content;
        this.ETag = ETag;
    }
}
globalThis.cachedRequests = [];
export default class CachedRequestsManager {
    static add(url, content, ETag= "") {
        log(`Adding ${url} to the cache.`);
        cachedRequests.push(new CachedRequest(url, content, ETag));
    }
    static find(url) {
        log(`Trying to find ${url} in the cache.`);
        for (let endpoint of cachedRequests) {
            if (endpoint.url === url) {
                log(`Found ${url} in the cache.`);
                return endpoint;
            }
        };
        log(`Could not find ${url} in the cache.`);
        return null;
    }
    static clear(url) {
        let indexToDelete = [];
        let index = 0;
        for (let endpoint of cachedRequests) {
            // target all entries related to the same APIendpoint url base
            if (endpoint.url.toLowerCase().indexOf(url.toLowerCase()) > -1) {
                log(`Deleting ${endpoint.url} from the cache.`);
                indexToDelete.push(index);
            }
            index++;
        }
        utilities.deleteByIndex(cachedRequests, indexToDelete);
    }
    static flushExpired(HttpContext) {
        for (let endpoint of cachedRequests) {
            if (endpoint.ETag != repositoryEtags[utilities.capitalizeFirstLetter(HttpContext.path.model)])
                CachedRequestsManager.clear(endpoint.url);
        }
    }
    static get(HttpContext) {
        if (HttpContext.req.method !== "GET") return false;
        CachedRequestsManager.flushExpired(HttpContext);
        let cachedReq = CachedRequestsManager.find(HttpContext.req.url);
        if (cachedReq !== null) {
            HttpContext.response.JSON( cachedReq.content, cachedReq.ETag, true);
            return true;
        }
        else return false;
    }
}