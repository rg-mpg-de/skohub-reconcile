#!/bin/sh

# Set variables to Environment variable or default values
: "${ES_PROTO:=http}"
: "${ES_HOST:=127.0.0.1}"
: "${ES_PORT:=9200}"
: "${ES_INDEX:=skohub-reconcile}"

curl --request PUT \
  --url "$ES_PROTO://$ES_HOST:$ES_PORT/$ES_INDEX" \
  --header 'Content-Type: application/json' \
  --data '{
	"settings": {
		"number_of_shards": 1,
		"max_result_window": "25000",
		"analysis": {
			"analyzer": {
				"default": {
					"type" : "custom",
					"tokenizer" : "standard",
					"filter": ["lowercase"]
				},
				"autocomplete": {
					"tokenizer": "edge_ngram_tokenizer",
					"filter": ["lowercase"]
				},
				"id": {
					"tokenizer": "keyword",
					"filter": "lowercase"
				},
				"ascii": {
					"tokenizer": "standard",
					"filter": ["lowercase", "asciifolding"]
				}
			},
			"tokenizer": {
				"edge_ngram_tokenizer": {
					"type": "edge_ngram",
					"min_gram": "2",
					"max_gram": "40",
					"token_chars": [
						"letter",
						"digit"
					]
				}
			}
		}
	},
	"mappings": {
		"date_detection" : false,
		"numeric_detection": false,
		"dynamic": true,
		"dynamic_templates": [
			{
				"prefLabel": {
					"path_match": "prefLabel.*",
					"mapping": {
						"type": "text",
						"fields": {
							"ngrams": {
								"type": "text",
								"analyzer": "autocomplete",
								"search_analyzer": "default"
							},
							"keyword": {
								"type": "keyword"
							},
							"ascii": {
								"type": "text",
								"analyzer": "ascii"
							},
							"completion": {
								"type": "completion",
								"contexts": [
									{
										"name": "account",
										"type": "category",
										"path": "account"
									},
									{
										"name": "dataset",
										"type": "category",
										"path": "dataset"
									}
								]
							}
						},
						"copy_to": "prefLabel_all",
						"index": true
					}
				}
			},
			{
				"altLabel": {
					"path_match": "altLabel.*",
					"mapping": {
						"type": "text",
						"fields": {
							"ngrams": {
								"type": "text",
								"analyzer": "autocomplete",
								"search_analyzer": "default"
							},
							"keyword": {
								"type": "keyword"
							},
							"ascii": {
								"type": "text",
								"analyzer": "ascii"
							},
							"completion": {
								"type": "completion",
								"contexts": [
									{
										"name": "account",
										"type": "category",
										"path": "account"
									},
									{
										"name": "dataset",
										"type": "category",
										"path": "dataset"
									}
								]
							}
						},
						"copy_to": "altLabel_all",
						"index": true
					}
				}
			},
			{
				"hiddenLabel": {
					"path_match": "hiddenLabel.*",
					"mapping": {
						"type": "text",
						"fields": {
							"ngrams": {
								"type": "text",
								"analyzer": "autocomplete",
								"search_analyzer": "default"
							},
							"keyword": {
								"type": "keyword"
							},
							"ascii": {
								"type": "text",
								"analyzer": "ascii"
							},
							"completion": {
								"type": "completion",
								"contexts": [
									{
										"name": "account",
										"type": "category",
										"path": "account"
									},
									{
										"name": "dataset",
										"type": "category",
										"path": "dataset"
									}
								]
							}
						},
						"copy_to": "hiddenLabel_all",
						"index": true
					}
				}
			},
			{
				"title": {
					"path_match": "title.*",
					"mapping": {
						"type": "text",
						"fields": {
							"ngrams": {
								"type": "text",
								"analyzer": "autocomplete",
								"search_analyzer": "default"
							},
							"keyword": {
								"type": "keyword"
							},
							"ascii": {
								"type": "text",
								"analyzer": "ascii"
							},
							"completion": {
								"type": "completion",
								"contexts": [
									{
										"name": "account",
										"type": "category",
										"path": "account"
									},
									{
										"name": "dataset",
										"type": "category",
										"path": "dataset"
									}
								]
							}
						},
						"copy_to": "title_all",
						"index": true
					}
				}
			},

			{
				"description": {
					"path_match": "description.*",
					"mapping": {
						"type": "text",
						"fields": {
							"ngrams": {
								"type": "text",
								"analyzer": "autocomplete",
								"search_analyzer": "default"
							},
							"keyword": {
								"type": "keyword"
							},
							"ascii": {
								"type": "text",
								"analyzer": "ascii"
							}
						},
						"copy_to": "description_all",
						"index": true
					}
				}
			},
			{
				"note": {
					"path_match": "note.*",
					"mapping": {
						"type": "text",
						"fields": {
							"ngrams": {
								"type": "text",
								"analyzer": "autocomplete",
								"search_analyzer": "default"
							},
							"keyword": {
								"type": "keyword"
							},
							"ascii": {
								"type": "text",
								"analyzer": "ascii"
							}
						},
						"copy_to": "note_all",
						"index": true
					}
				}
			},
			{
				"scopeNote": {
					"path_match": "scopeNote.*",
					"mapping": {
						"type": "text",
						"fields": {
							"ngrams": {
								"type": "text",
								"analyzer": "autocomplete",
								"search_analyzer": "default"
							},
							"keyword": {
								"type": "keyword"
							},
							"ascii": {
								"type": "text",
								"analyzer": "ascii"
							}
						},
						"copy_to": "scopeNote_all",
						"index": true
					}
				}
			},
			{
				"editorialNote": {
					"path_match": "editorialNote.*",
					"mapping": {
						"type": "text",
						"fields": {
							"ngrams": {
								"type": "text",
								"analyzer": "autocomplete",
								"search_analyzer": "default"
							},
							"keyword": {
								"type": "keyword"
							},
							"ascii": {
								"type": "text",
								"analyzer": "ascii"
							}
						},
						"copy_to": "editorialNote_all",
						"index": true
					}
				}
			},
			{
				"historyNote": {
					"path_match": "historyNote.*",
					"mapping": {
						"type": "text",
						"fields": {
							"ngrams": {
								"type": "text",
								"analyzer": "autocomplete",
								"search_analyzer": "default"
							},
							"keyword": {
								"type": "keyword"
							},
							"ascii": {
								"type": "text",
								"analyzer": "ascii"
							}
						},
						"copy_to": "historyNote_all",
						"index": true
					}
				}
			},
			{
				"changeNote": {
					"path_match": "changeNote.*",
					"mapping": {
						"type": "text",
						"fields": {
							"ngrams": {
								"type": "text",
								"analyzer": "autocomplete",
								"search_analyzer": "default"
							},
							"keyword": {
								"type": "keyword"
							},
							"ascii": {
								"type": "text",
								"analyzer": "ascii"
							}
						},
						"copy_to": "changeNote_all",
						"index": true
					}
				}
			},
			{
				"definition": {
					"path_match": "definition.*",
					"mapping": {
						"type": "text",
						"fields": {
							"ngrams": {
								"type": "text",
								"analyzer": "autocomplete",
								"search_analyzer": "default"
							},
							"keyword": {
								"type": "keyword"
							},
							"ascii": {
								"type": "text",
								"analyzer": "ascii"
							}
						},
						"copy_to": "definition_all",
						"index": true
					}
				}
			},
			{
				"example": {
					"path_match": "example.*",
					"mapping": {
						"type": "text",
						"fields": {
							"ngrams": {
								"type": "text",
								"analyzer": "autocomplete",
								"search_analyzer": "default"
							},
							"keyword": {
								"type": "keyword"
							},
							"ascii": {
								"type": "text",
								"analyzer": "ascii"
							}
						},
						"copy_to": "example_all",
						"index": true
					}
				}
			}
		],

		"properties": {
			"@context": {
				"enabled": false
			},
			"inScheme.id": {
				"type": "keyword",
				"index": true
			},
			"account": {
				"type": "keyword",
				"index": true
			},
			"dataset": {
				"type": "keyword",
				"index": true
			},
			"id": {
				"type": "keyword",
				"index": true
			},
			"notation": {
				"type": "keyword",
				"index": true
			},
			"type" : {
				"type": "keyword",
				"index": true
			},

			"broader": {
				"enabled": false
			},
			"narrower": {
				"enabled": false
			}
		}
	}
}
'
