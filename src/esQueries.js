import config from './config.js'
import esb, { completionSuggester } from 'elastic-builder'
import * as esConnect from './esConnect.js'

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

// Query for concepts and/or vocabularies
async function query (tenant, vocab, reqQueries) {
  // console.log(`vquery(tenant, vocab, reqQueries): ${tenant}, ${vocab}, ${JSON.stringify(reqQueries)}`)
  var queries = ""
  const reqObject = esb.requestBodySearch()

  if (reqQueries) {
    for (var key in reqQueries) {
       reqObject.query(
        esb.boolQuery()
          .must([ ...(tenant ? [esb.termQuery('tenant', tenant)] : []), // add tenant condition only if tenant is set
                  ...(vocab ? [esb.termQuery('vocab', vocab)] : []),    // add vocab condition only if vocab is set
                  ...(vocab ? [esb.boolQuery()
                                .should([ esb.termQuery('inScheme.id', vocab),
                                          esb.termQuery('inScheme.id', 'http://' + vocab),
                                          esb.termQuery('inScheme.id', 'https://' + vocab),
                                          esb.termQuery('id', vocab),
                                          esb.termQuery('id', 'http://' + vocab),
                                          esb.termQuery('id', 'https://' + vocab),
                                          esb.termQuery('vocab', vocab),
                                        ])] : []),
                  ...(!vocab ? [esb.boolQuery().must(esb.queryStringQuery('ConceptScheme').defaultField('type'))] : []), // if we don't have a vocab parameter, only search for vocabularies...
                  esb.multiMatchQuery(esMultiFields, reqQueries[key].query)
                ])
          .should( reqQueries[key]['type'] ?
                    esb.queryStringQuery(reqQueries[key]['type']).defaultField('type').boost(4) :
                    esb.queryStringQuery('Concept').defaultField('type')
                 )
        )
        .size(reqQueries[key].limit || 5)
      queries = queries + `{ "index": "${index}" }` + '\n'
      queries = queries + JSON.stringify(reqObject.toJSON()) + '\n'
    }
  } else {
    reqObject.query(
      esb.boolQuery()
        .must([ ...(tenant ? [esb.termQuery('tenant', tenant)] : []), // add tenant condition only if tenant is set
                ...(vocab ? [esb.termQuery('vocab', vocab)] : []),    // add vocab condition only if vocab is set
                esb.termQuery('type', 'ConceptScheme')
              ])
        .should([ ...(vocab ? [esb.termQuery('id', vocab)] : []) ])
      )
      .size(5)
    queries = `{"index":"${index}"}` + '\n' + JSON.stringify(reqObject.toJSON()) + '\n'
  }
  // console.log(`queries: ${queries}`)

  var result = await esClient.msearch({
    body: queries
  })
  // console.log(`result:\n${JSON.stringify(result)}`)
  return result
}

// Query for a particular object (Concept or ConceptScheme)
async function queryID (tenant, vocab, id) {
  // console.log(` queryID(tenant, vocab, id): ${tenant}, ${vocab}, ${id}`)
  var queries = ''
  const reqObject = esb.requestBodySearch()
    .query(esb.boolQuery()
      .must([ ...(tenant ? [esb.termQuery('tenant', tenant)] : []), // add tenant condition only if tenant is set
              ...(vocab ? [esb.termQuery('vocab', vocab)] : []),    // add vocab condition only if vocab is set
              ...(id ? [esb.termsQuery('id', [id, vocab + '/' + id])] : []), // add id condition only if id is set
              ...(!id ? [esb.queryStringQuery('ConceptScheme').defaultField('type')] : []), // if there's no id, then search for vocabs
            ])
    )
    .size(5)
  queries = queries + `{ "index": "${index}" }` + '\n' + JSON.stringify(reqObject.toJSON()) + '\n'
  // console.log(queries)

  var result = await esClient.msearch({
    body: queries
  })
  // console.log(`result:\n${JSON.stringify(result)}`)
  return result
}

// Query for autocompletion suggestions for a prefix string
async function suggest (tenant, vocab, prefix, cursor) {
  // console.log(` suggest(tenant, vocab, prefix, cursor): ${tenant}, ${vocab}, ${prefix}, ${cursor}`)

  const defaultLanguage = 'de'
  // See https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/suggest_examples.html
  // Define a contexts object having either tenant or vocab or both
  const ctx = {
    ...(tenant && { tenant: [ tenant ] }),
    ...(vocab && { vocab: [ vocab ] })
  }

  var suggests
  // For each of the fields, define a completion search
  (['prefLabel', 'altLabel', 'title']).forEach(n => {
    var item = {
      prefix: prefix,
      completion: {
          field: `${n}.${defaultLanguage}.completion`,
          skip_duplicates: true,
          fuzzy: true,
          // conditionally add the context object if either tenant or vocab is given
          ...( (tenant || vocab) && { contexts: ctx } )
        }
      }
    // console.log(`item: ${JSON.stringify(item)}`)
    suggests = { [`${n}Suggest`]: item, ...suggests }
  })

  var queries = `{ "index": "${index}" }` + '\n' + JSON.stringify({ suggest: suggests }) + '\n'
  // console.log(`queries: ${queries}`)

  // Do the search
  var result = await esClient.msearch({
    body: queries
  })
  // console.log(`result:\n${JSON.stringify(result)}`)
  return result
}

export { query, queryID, suggest }
