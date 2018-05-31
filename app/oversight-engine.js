
class OversightEngine {

  constructor() {
    this.data = {}
  }

  loadObject(type, o) {
    let items = this.data[type]
    if (!items) {
      this.data[type] = items = []
    }
    items.push(o)
  }

}

module.exports = OversightEngine