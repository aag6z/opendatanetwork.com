var CacheController = require('./cache-controller');

var _moment = require('moment');
var _numeral = require('numeral');
var _request = require('request');

var _baseUrl = 'http://api.us.socrata.com/api/catalog/v1';
var _cacheController = new CacheController();
var _categoriesUrl = _baseUrl + '/categories';
var _defaultFilterCount = 10;
var _defaultSearchResultCount = 20;
var _domainsUrl = _baseUrl + '/domains';
var _maxDescriptionLength = 300;
var _searchUrl = _baseUrl;
var _tagsUrl = _baseUrl + '/tags';
var _userAgent = 'www.opendatanetwork.com';

module.exports = SearchController;

function SearchController() {
}

// Public methods
//
SearchController.prototype.getCategories = function(count, completionHandler) {

    getFromCacheOrApi(_categoriesUrl, function(results) {

        truncateResults(count, results, completionHandler);
    });
};

SearchController.prototype.getDomains = function(count, completionHandler) {

    getFromCacheOrApi(_domainsUrl, function(results) {

        truncateResults(count, results, completionHandler);
    });
};

SearchController.prototype.getTags = function(count, completionHandler) {

    getFromCacheOrApi(_tagsUrl, function(results) {

        truncateResults(count, results, completionHandler);
    });
};

SearchController.prototype.search = function(params, completionHandler) {

    getFromApi(
        getUrlFromSearchParameters(params), 
        function(results) {

            annotateData(results);
            annotateParams(results, params);

            if (completionHandler)
                completionHandler(results);
        });
};

SearchController.prototype.getSearchParameters = function(query) {

    var categories = getNormalizedArrayFromDelimitedString(query.categories);
    var domains = getNormalizedArrayFromDelimitedString(query.domains);
    var tags = getNormalizedArrayFromDelimitedString(query.tags);
    var page = isNaN(query.page) ? 1 : parseInt(query.page);
    var ec = getExpandedFiltersSetting(query.ec);
    var ed = getExpandedFiltersSetting(query.ed);
    var et = getExpandedFiltersSetting(query.et);

    return {
        only : 'datasets',
        q : query.q || '',
        page : page,
        offset : (page - 1) * _defaultSearchResultCount,
        limit : _defaultSearchResultCount,        
        categories : categories,
        domains : domains,
        tags : tags,
        ec : ec,
        ed : ed,
        et : et,
    };
};

// Private functions
//
function annotateData(data) {

    // resultSetSizeString
    //
    data.resultSetSizeString = _numeral(data.resultSetSize).format('0,0');

    data.results.forEach(function(result) {

        // categoryGlyphString, updatedAtString
        //
        result.classification.categoryGlyphString = getCategoryGlyphString(result);
        result.resource.updatedAtString = _moment(result.resource.updatedAt).format('D MMM YYYY');

        // Truncate description
        //
        if (result.resource.description.length > _maxDescriptionLength) {

            result.resource.description = result.resource.description.substring(0, _maxDescriptionLength);

            var lastIndex = result.resource.description.lastIndexOf(" ");
            result.resource.description = result.resource.description.substring(0, lastIndex) + " ... ";
        }
    });
    
}

function annotateParams(data, params) {

    params.totalPages = Math.ceil(data.resultSetSize / _defaultSearchResultCount);
}

function getCategoryGlyphString(result) {

    if ((result.classification == null) ||
        (result.classification.categories == null) ||
        (result.classification.categories.length == 0)) {

        return 'fa-database';
    }

    switch (result.classification.categories[0].toLowerCase()) {

        case 'health': return 'fa-heart';
        case 'transportation': return 'fa-car';
        case 'finance': return 'fa-money';
        case 'social services': return 'fa-child';
        case 'environment': return 'fa-leaf';
        case 'public safety': return 'fa-shield';
        case 'housing and development': return 'fa-building';
        case 'infrastructure': return 'fa-road';
        case 'education': return 'fa-graduation-cap';
        case 'recreation': return 'fa-ticket';
        default: return 'fa-database';
    }
}

function getExpandedFiltersSetting(queryValue) {
    
    return isNaN(queryValue) ? false : (parseInt(queryValue) == 1);
}

function getNormalizedArrayFromDelimitedString(s) {

    if (s == null) 
        return [];

    var parts = s.split(',');

    if ((parts.length == 1) && (parts[0] == ''))
        parts = [];

    for (var i in parts) {
        parts[i] = parts[i].toLowerCase();
    }

    return parts;
}

function getUrlFromSearchParameters(params) {

    var url = _searchUrl +
        '?offset=' + params.offset +
        '&only=' + params.only +
        '&limit=' + params.limit;

    if ((params.q != null) && (params.q.length > 0))
        url += '&q=' + encodeURIComponent(params.q);

    if (params.categories.length > 0)
        url += '&categories=' + encodeURIComponent(params.categories.join(','));

    if (params.domains.length > 0)
        url += '&domains=' + encodeURIComponent(params.domains.join(','));

    if (params.tags.length > 0)
        url += '&tags=' + encodeURIComponent(params.tags.join(','));

    if (params.ec)
        url += '&ec=1';

    if (params.ed)
        url += '&ed=1';

    if (params.et)
        url += '&et=1';

    return url;
}

function getFromApi(url, completionHandler) {

    _request(
        {
            url: url, 
            headers: { 'User-Agent' : _userAgent }
        }, 
        function(err, resp) {

            if (err) {

                console.log('Could not connect to Socrata');

                if (completionHandler) completionHandler();
                return;
            }

            if (resp.statusCode != 200) {

                console.log(resp.body);

                if (completionHandler) completionHandler();
                return;
            }

            console.log('Get from api: ' + url);

            if (completionHandler) {

                var results = JSON.parse(resp.body);
                completionHandler(results);
            }
        });
};

function getFromCacheOrApi(url, completionHandler) {

    _cacheController.get(url, function(results) {

        if (results != undefined) {

            if (completionHandler) completionHandler(results);
            return;
        }

        getFromApi(url, function(results) {

            _cacheController.set(url, results, completionHandler);
        });
    });
}

function truncateResults(count, results, completionHandler) {

    if ((count != null) && (count >= 0))
    {
        if (results.results.length > count)
            results.results.length = count;
    }

    if (completionHandler)
        completionHandler(results)
}
