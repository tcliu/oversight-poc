const fs = require('fs')
const readline = require('readline')

/**
 * Loads a CSV.
 *
 * @param path path of the CSV
 * @param fieldProcessor mapping of field to respective processor (e.g. numbers, dates)
 *        e.g. {field1: processor1, field2: processor2}
 * @param filter record filter
 */
const loadCsv = (path, fieldProcessors, filter) => new Promise((resolve, reject) => {
  const rl = readline.createInterface({
    input: fs.createReadStream(path)
  })
  const records = []
  let headers
  rl.on('line', line => {
    const toks = line.split(',')
    if (!headers) {
      headers = toks.map(tok => tok.toLowerCase().replace(/\s+/g, '_'))
    } else {
      const o = {}
      for (let i=0; i<toks.length; i++) {
        o[headers[i]] = toks[i]
      }
      if (fieldProcessors) {
        for (let k in fieldProcessors) {
          if (k in o) {
            o[k] = fieldProcessors[k](o[k])
          }
        }
      }
      if (!filter || filter(o)) {
        records.push(o)
      }
    }
  })
  rl.on('close', () => {
    resolve(records)
  })
})

module.exports = {loadCsv}