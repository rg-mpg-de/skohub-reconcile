import config from '../config.js'
import esb from 'elastic-builder'
import esConnect from '../esConnect.js'
import {queryID} from "./queryID.js"

const index = config.es_index
const esClient = esConnect.esClient
const esMultiFields = [
  'prefLabel*^4.0',
  'altLabel*^2.0',
  'hiddenLabel*^1.5',
  'title*^3.0',
  'description*^1.0',
  'notation*^1.2'
]

/**
 * Query for concepts and/or vocabularies
 * @param {string} account 
 * @param {string} dataset 
 * @param {object} reqQueries Query objects according to [reconciliation spec](https://reconciliation-api.github.io/specs/0.2/#structure-of-a-reconciliation-query).
 * @returns {object} Elasticsearch query result
 */

async function query (account, dataset, reqQueries = null) {
  const requests = []
  if (reqQueries) {
    for (let key in reqQueries) {
      const reqObject = esb.requestBodySearch()
      reqObject.query(
        esb.boolQuery()
          .must([ ...(account ? [esb.termQuery('account', account)] : []), // add account condition only if account is set
                  ...(dataset ? [esb.termQuery('dataset', dataset)] : []), // add dataset condition only if dataset is set
                  ...(dataset ? [esb.boolQuery()
                                .should([ esb.termQuery('inScheme.id', dataset),
                                          // esb.termQuery('inScheme.id', 'http://' + dataset),
                                          // esb.termQuery('inScheme.id', 'https://' + dataset),
                                          esb.termQuery('id', dataset),
                                          // esb.termQuery('id', 'http://' + dataset),
                                          // esb.termQuery('id', 'https://' + dataset),
                                          esb.termQuery('dataset', dataset),
                                        ])] : []),
                  ...(!dataset ? [esb.boolQuery().must(esb.queryStringQuery('ConceptScheme').defaultField('type'))] : []), // if we don't have a dataset parameter, only search for vocabularies...
                  esb.multiMatchQuery(esMultiFields, reqQueries[key].query)
                ])
          .should( reqQueries[key]['type'] ?
                    esb.queryStringQuery(reqQueries[key]['type']).defaultField('type').boost(4) :
                    esb.queryStringQuery('Concept').defaultField('type')
                 )
        )
        .size(reqQueries[key].limit || 500)
    requests.push(reqObject)
    }
  } else {
    const reqObject = esb.requestBodySearch()
    reqObject.query(
      esb.boolQuery()
        .must([ ...(account ? [esb.termQuery('account', account)] : []), // add account condition only if account is set
                ...(dataset ? [esb.termQuery('dataset', dataset)] : []), // add dataset condition only if dataset is set
                esb.termQuery('type', 'ConceptScheme')
              ])
        .should([ ...(dataset ? [esb.termQuery('id', dataset)] : []) ])
      )
      .size(500)
    requests.push(reqObject)
  }

  const searches = requests.flatMap((doc) => [
    {index: index},
    {...doc.toJSON()}
  ])
  const result = await esClient.msearch({
    searches: searches
  })
  return result
}



// Query for autocompletion suggestions for a prefix string
async function suggest (account, dataset, prefix, cursor, prefLang) {
  // See https://www.elastic.co/guide/en/elasticsearch/reference/current/search-suggesters.html#context-suggester
  // Define a contexts object having either account or dataset or both
  let ctx
  if (!account && !dataset) {
    ctx = { account: await getAccounts() }
  } else {
    ctx = {
      ...(account && { account: [ account ] }),
      ...(dataset && { dataset: [ dataset ] })
    }
  }
  console.log(10+cursor)
  console.log(cursor)
  // For each of the fields, define a completion search
  const suggests = (['prefLabel', 'altLabel', "hiddenLabel", 'title']).map(n => {
    return {
      suggest: {
        "rec-suggest": {
          prefix: prefix,
          completion: {
              field: `${n}.${prefLang}.completion`,
              skip_duplicates: true,
              fuzzy: true,
              contexts: ctx,
              size: 10 + cursor
            }
          }
        }
      }
  })

  // Do the search
  const searches = suggests.flatMap((suggest) => [
    {index: index},
    {...suggest}
  ])
  const result = await esClient.msearch({
    searches: searches
  })
  return result
}

// Get all account names
async function getAccounts () {
  var accounts = []
  var aggs = { from: 0,
               size: 0,
               track_total_hits: false,
               aggs: {
                  accounts: {
                      terms: { field: "account" }
                  }
               }
             }
  var queries = `{ "index": "${index}" }` + '\n' + JSON.stringify(aggs) + '\n'

  // Do the search
  try {
    const resp = await esClient.search({
      index: index,
      ...aggs
    })
    resp.aggregations.accounts.buckets.forEach((element, _) => {
        accounts.push(element.key)
      })
    return accounts 
  } catch (error) {
    console.trace(error)
    return []
  }
}

// Get all dataset names
async function getDatasets () {
  var datasets = []
  var aggs = { from: 0,
    size: 0,
    track_total_hits: false,
    aggs: {
       datasets: {
           terms: { field: "dataset" }
       }
    }
  }
  var queries = `{ "index": "${index}" }` + '\n' + JSON.stringify(aggs) + '\n'
  // console.log(`queries: ${queries}`)

  // Do the search
  try {
    const resp = await esClient.search({
      index: index,
      ...aggs
    })
    resp.aggregations.datasets.buckets.forEach((element, _) => {
        datasets.push(element.key)
      })
    return datasets
  } catch (error) {
    console.trace(error)
    return []
  }
}

export default { query, queryID, suggest, getAccounts, getDatasets }