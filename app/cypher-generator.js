const util = require('util')
const _ = require('lodash')
const JSONPath = require('jsonpath-plus')
const uuidv4 = require('uuid/v4')

function isPrimitive(obj) {
  return !obj || typeof obj !== 'object' || isPlainArray(obj)
}

function isArray(obj, itemRule) {
  return obj && Array.isArray(obj) && (!itemRule || obj.every(itemRule))
}

function isObjectArray(obj) {
  return isArray(obj, _.isPlainObject)
}

function isPlainArray(obj) {
  return isArray(obj, isPrimitive)
}

function isPlainObject(obj) {
  return _.isPlainObject(obj)
}

function hasRelationships(obj) {
  return Object.keys(obj).some(k => k !== '_type' && k.indexOf('_') == 0)
}

function belongToProperty(parent, child, attr) {
  return parent[attr] && parent[attr].some(o => o === child)
}

function toJson(obj) {
  // exclude nested properties
  const props = {}
  for (let k in obj) {
    if ((k.indexOf('_') != 0) && isPrimitive(obj[k])) {
      props[k] = obj[k]
    }
  }
  return util.inspect(props)
}

function appendKey(obj, key, value) {
  if (!obj[key]) {
    obj[key] = value
  } else if (isArray(obj[key])) {
    obj[key].push(value)
  } else {
    obj[key] = [obj[key], value]
  }
}

function fillTypes(obj, typeConfig) {
  if (!obj || isPrimitive(obj)) {
    return obj
  } else {
    // handle type config
    if (isArray(typeConfig)) {
      typeConfig.forEach(cfg => {
        let paths = cfg.paths
        if (!isArray(paths)) {
          paths = [paths]
        }
        paths.forEach(path => {
          JSONPath({json: obj, path: path})
            .filter(prop => !prop._type)
            .forEach(prop => prop._type = _.isFunction(cfg.name) ? cfg.name(prop) : cfg.name)
        })
      })
    }
    // fill types from parent
    const s = isObjectArray(obj) ? obj.map(o => ({item: o})) : [{item: obj}]
    while (s.length > 0) {
      const {item, attr} = s.pop()
      if (!item._type && attr) {
        item._type = generateObjectTypeName(attr)
      }
      Object.keys(item)
        .filter(k => k.indexOf('_') != 0 && !isPrimitive(item[k]))
        .forEach(k => {
          if (isObjectArray(item[k])) {
            item[k].forEach(o => s.push({item: o, attr: k}))
          } else if (isPlainObject(item[k])) {
            s.push({item: item[k], attr: k})
          }
        })
    }
  }
}

function fillRelationships(obj, relConfig) {
  if (!obj || isPrimitive(obj)) {
    return obj
  } else {
    // handle relationship config
    if (isArray(relConfig)) {
      relConfig.forEach(cfg => {
        const fromObjs = JSONPath({json: obj, path: cfg.from})
        const toObjs = JSONPath({json: obj, path: cfg.to})
        fromObjs.forEach(from => {
          toObjs.forEach(to => {
            if (cfg.matcher && cfg.matcher(from, to)) {
              const relName = _.isFunction(cfg.name) ? cfg.name(from, to) : cfg.name
              if (relName) {
                appendKey(from, '_' + relName, to)
              }
            }
          })
        })
      })
    }
    // fill relationships from parent
    const s = isObjectArray(obj) ? obj.map(o => ({item: o})) : [{item: obj}]
    while (s.length > 0) {
      const {item, parent} = s.pop()
      if (parent && !isPrimitive(item) && !item._PARENT && !hasRelationships(item)) {
        item._PARENT = parent
      }
      Object.keys(item)
        .filter(k => k.indexOf('_') != 0 && !isPrimitive(item[k]))
        .forEach(k => {
          if (isObjectArray(item[k])) {
            item[k].forEach(o => s.push({item: o, parent: item, attr: k}))
          } else if (isPlainObject(item[k])) {
            s.push({item: item[k], parent: item, attr: k})
          }
        })
    }
  }
}

function generateRelationshipName(k) {
  return k.replace(/s$/, '').toUpperCase()
}

function generateObjectTypeName(k, isCollection) {
  const name = k.replace(/s$/, '')
  return name[0].toUpperCase() + name.substring(1)
}

function mergeObjects(obj, lines) {
  const s = isObjectArray(obj) ? obj.map(o => ({item: o})) : [{item: obj}]
  // merge objects
  while (s.length > 0) {
    const {item} = s.shift()
    if (item._type) {
      mergeObject(item, lines)
    }
    Object.keys(item)
      .filter(k => k !== '_type' && k.indexOf('_') != 0)
      .forEach(k => {
        if (isObjectArray(item[k])) {
          item[k].forEach(o => s.push({item: o, attr: k}))
        } else if (isPlainObject(item[k])) {
          s.push({item: item[k], attr: k})
        }
      }) 
  }
}

function mergeRelationships(obj, lines) {
  const s = isObjectArray(obj) ? obj.map(o => ({item: o})) : [{item: obj}]
  const walked = new Set()
  while (s.length > 0) {
    const {item} = s.shift()
    if (!walked.has(item)) {
      walked.add(item)
      Object.keys(item)
        .filter(k => k !== '_type' && !isPrimitive(item[k]))
        .forEach(k => {
          if (k.indexOf('_') == 0 && item._type && item[k]._type) {
            const relName = generateRelationshipName(k.substring(1))
            mergeRelationship(item, item[k], relName, lines)
          } else {
            if (isObjectArray(item[k])) {
              item[k].forEach(o => s.push({item: o}))
            } else if (isPlainObject(item[k])) {
              s.push({item: item[k]})
            }
          }
        }) 
    }
  }
}

function mergeObject(obj, lines) {
  lines.push(`merge (n: ${obj._type || ''} ${toJson(obj)});`)
}

function mergeRelationship(o1, o2, relType, lines) {
  lines.push(`match (n1: ${o1._type || ''} ${toJson(o1)}), (n2: ${o2._type || ''} ${toJson(o2)})
    merge (n1)-[:${relType.toUpperCase()}]->(n2);`)
}

function buildRelationships(obj, config) {
  const o = _.cloneDeep(obj)
  fillTypes(o, config && config.types)
  fillRelationships(o, config && config.rels)
  return o
}

// main function
function generateCypher(obj, config) {
  const lines = []
  if (config && config.mode === 'create') {
    deleteAll(lines)
  }
  const bObj = buildRelationships(obj, config)
  mergeObjects(bObj, lines)
  mergeRelationships(bObj, lines)
  return lines.join('\n')
}

function deleteAll(lines) {
  lines.push('match (n) detach delete n;')
}

module.exports = {
  generateCypher,
  buildRelationships,
  belongToProperty
}