const DEFAULT_FIELD_MAPPERS = {
  num: Number,
  bool: Boolean,
  round_2: v => Math.round(Number(v) * 100) / 100, // round to 2 decimal places
}

/**
 * Constructs the mapping of field mappers.
 *
 * @param cfg the configuration
 *        e.g. {num: ['field1','field2']}
 *             {num: 'field1,field2'}
 */
exports.constructFieldMappers = cfg => {
  const fieldMappers = {}
  for (let type in cfg) {
    let fields = cfg[type]
    if (typeof fields === 'string') {
      fields = fields.split(',').map(s => s.trim())
    }
    fields.forEach(k => {
      fieldMappers[k] = DEFAULT_FIELD_MAPPERS[type]
    })
  }
  return fieldMappers
}
