#!/usr/bin/env node

const clut = require('clut')
const axios = require('axios').default
const { version } = require('./package.json')

const options = {
  lang: 'two-letter code (ISO 639-1) used to indicate preferred language',
  extra: 'include associated links and related topics in search result'
}

const {
  args,
  getFlags,
  hasUnknownFlags,
  unknownFlags,
  parseArg,
  parseBoolean
} = clut(process.argv, Object.keys(options))

if (!args.length) {
  console.log('Usage: duckup <searchTerm> [options]')
  console.log('Allowed options:')
  Object.entries(options).forEach(([key, value]) => {
    console.log(`${key} (${getFlags(key)}) -- ${value}`)
  })
  process.exit(0)
}

if (hasUnknownFlags) {
  console.log('Unknown option(s):', unknownFlags)
  process.exit(1)
}

const lang = parseArg('lang') || '*'
const extra = parseBoolean('extra')

const searchTerm = args[0]
const params = [
  `q=${decodeURIComponent(searchTerm)}`,
  'format=json',
  't=duckup'
]
const url = `https://api.duckduckgo.com/?${params.join('&')}`
const userAgent = `duckup v${version} (https://github.com/matsrorbecker/duckup, mats@rorbecker.com)`

const search = async () => {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': userAgent,
        'Accept-Language': lang
      }
    })
    if (response.status !== 200) throw new Error(`Server responded with ${response.status}`)
    return response.data
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
}

const displayResult = result => {
  const { AbstractText, AbstractURL, Results, RelatedTopics } = result
  if (!AbstractText) {
    console.log("\nCouldn't find instant answer on DuckDuckGo... :(\n")
    process.exit(0)
  }
  console.log('\nInstant answer from DuckDuckGo:')
  console.log('===============================\n')
  console.log(AbstractText, '\n')
  console.log('Further reading:', AbstractURL)
  if (extra && Results.length) {
    console.log('\nAssociated links:')
    console.log('-----------------')
    Results.forEach(({ FirstURL, Text }) => {
      console.log(Text)
      console.log(FirstURL, '\n')
    })
  }
  if (extra && RelatedTopics.length) {
    console.log('\nRelated topics:')
    console.log('---------------')
    RelatedTopics.forEach(({ FirstURL, Text }) => {
      console.log(Text)
      console.log(FirstURL, '\n')
    })
  }
}

search().then(displayResult)
