// exports.default = updateJson;
// exports.getRangeAttributes = getRangeAttributes;

function convertHimalayaAtrributes (attributes) {
  var result = {}

  attributes.forEach(function (attribute) {
    var key = attribute.key
    var value = attribute.value

    switch (key) {
      case 'style':
        value = styleToJson(value)
    }

    result[key] = value
  })

  return result
}

function mergeStyles (newStyle, oldStyle) {
  oldStyle = JSON.parse(JSON.stringify(oldStyle || {}));
  newStyle = JSON.parse(JSON.stringify(newStyle || {}));

  for (var key in oldStyle) {
    if (newStyle[key]) {
      oldStyle[key] = newStyle[key]
    }
  }

  for (var key in newStyle) {
    if (!oldStyle[key]) {
      oldStyle[key] = newStyle[key]
    }
  }

  return oldStyle
}

function rgbStrToHex (color) {
  if (color.indexOf('rgb') == -1) {
    return color
  }
  color = color.substring(color.indexOf('(') + 1, color.indexOf(')'))
  color = color.split(',')
  var r = rgbToHex(parseInt(color[0]))
  var g = rgbToHex(parseInt(color[1]))
  var b = rgbToHex(parseInt(color[2]))
  return '#' + r + g + b
}

// Given a json, converts it to css style string.
function styleToJson (stylStr) {
  var obj = {}

  stylStr.split(';').forEach(function (string) {
    if (string !== '') {
      var attr = string.split(':')
      while (attr[0].indexOf('-') > 0) { // - is in the attribute name, but is not the first character either
        var afterDash = attr[0].substring(attr[0].indexOf('-') + 1)
        afterDash = afterDash.substring(0, 1).toUpperCase() + afterDash.substring(1)
        attr[0] = attr[0].substring(0, attr[0].indexOf('-')) + afterDash
      }

      obj[attr[0]] = attr[1]
    }
  })
  if (obj.color) {
    obj.color = rgbStrToHex(obj.color)
  }
  return obj
}

// Given a json, converts it to css style string.
function jsonToStyle (json) {
  var str = ''

  for (var key in json) {
    switch (key) {
      case 'color':
        str += 'color:' + json[key] + ';'
        break

      case 'fontWeight':
        str += 'font-weight:' + json[key] + ';'
        break

      case 'fontStyle':
        str += 'font-style:' + json[key] + ';'
        break
    }
  }

  return str
}

// Himalaya span node object template
function getNewSpanNode () {
  return {
    'type': 'element',
    'tagName': 'span',
    'attributes': [],
    'children': []
  }
}

// Himalaya text node object template
function getNewTextNode () {
  return {
    'type': 'text',
    'content': ''
  }
}

function attributesAreEqual (obj1, obj2) {
  for (var p in obj1) {
    if (obj1.hasOwnProperty(p) !== obj2.hasOwnProperty(p)) return false

    switch (typeof (obj1[p])) {
      case 'object':
        if (!attributesAreEqual(obj1[p], obj2[p])) return false
        break

      case 'function':
        if (typeof (obj2[p]) === 'undefined' || (p != 'compare' && obj1[p].toString() != obj2[p].toString())) return false
        break

      default:
        if (obj1[p] != obj2[p]) return false
    }
  }
  for (var p in obj2) {
    if (typeof (obj1[p]) === 'undefined') return false
  }
  return true
}

function getSelectionNode (attributes, extraAttributes, result) {
  if (operationMode == 'reset') {
    return selectionNode
  }

  if (selectionNode) {
    attributes = JSON.parse(JSON.stringify(attributes));
    for(var key in extraAttributes) {
      if(key == "style") {
        attributes['style'] = mergeStyles(extraAttributes['style'], attributes['style']);
      } else {
        attributes[key] = extraAttributes[key];
      }
    }
    var currentAttributes = JSON.parse(JSON.stringify(selectionNode.attributes))
    currentAttributes = convertHimalayaAtrributes(currentAttributes)
    if (attributesAreEqual(currentAttributes, attributes)) {
      return selectionNode
    }

    selectionNode = getNewSpanNode()
    selectionNode = setAttributes(selectionNode, attributes)
    result.push(selectionNode)
    return selectionNode
  }
}

// Given a node (json) and the attributes, applies the attributes to the node in the himalayan format
function setAttributes (json, attributes, oldAttributes) {
  oldAttributes = oldAttributes || {}
  for (var key in attributes) {
    switch (key) {
      case 'style':
        var value = mergeStyles(attributes[key], oldAttributes[key])
        value = jsonToStyle(value)
        json.attributes.push({
          'key': 'style',
          'value': value
        })
        break
      case 'class':
        json.attributes.push({
          'key': 'class',
          'value': attributes['class']
        })
        break
    }
  }
  return json
}

var selectionNode = null // Points to the new node that was created to hold the selected text.
var done = false // Indicates whether all of the selection is processed or not. Once this becomes true, no more processing has to be done. The remianing nodes can be appended without processing.
var content = '' // holds the full content of the root node without any tags. only html.
var operationMode = 'reset'

// Processes node to extract selection and put it in a new node.
function processNode (node, start, end, attributes) {
  var result = []
  var span, text
  switch (node.type) {
    case 'text':

      if (node.position.start.absIndex == start) {
        if (node.position.end.absIndex == end) {
          span = getNewSpanNode()
          span.children.push(JSON.parse(JSON.stringify(node))) // TODO better to take copy of node
          span = setAttributes(span, attributes)
          result.push(span)
          done = true
        } else if (node.position.end.absIndex > end) {
          span = getNewSpanNode()
          text = getNewTextNode()
          text.content = content.substring(start, end + 1)
          span.children.push(text)
          span = setAttributes(span, attributes)
          result.push(span)

          text = getNewTextNode()
          text.content = content.substring(end + 1, node.position.end.absIndex + 1)
          result.push(text)

          done = true
        } else if (node.position.end.absIndex < end) {
          span = getNewSpanNode()
          text = getNewTextNode()
          text.content = content.substring(start, node.position.end.absIndex + 1)
          span.children.push(text)
          span = setAttributes(span, attributes)
          result.push(span)

          selectionNode = span
          done = false
        }
      } else if (node.position.start.absIndex < start) {
        if (node.position.end.absIndex >= start) {
          if (node.position.end.absIndex == end) {
            text = getNewTextNode()
            text.content = content.substring(node.position.start.absIndex, start)
            result.push(text)

            span = getNewSpanNode()
            text = getNewTextNode()
            text.content = content.substring(start, node.position.end.absIndex + 1)
            span.children.push(text)
            span = setAttributes(span, attributes)
            result.push(span)

            done = true
          } else if (node.position.end.absIndex > end) {
            text = getNewTextNode()
            text.content = content.substring(node.position.start.absIndex, start)
            result.push(text)

            span = getNewSpanNode()
            text = getNewTextNode()
            text.content = content.substring(start, end + 1)
            span.children.push(text)
            span = setAttributes(span, attributes)
            result.push(span)

            text = getNewTextNode()
            text.content = content.substring(end + 1, node.position.end.absIndex + 1)
            result.push(text)

            done = true
          } else if (node.position.end.absIndex < end) {
            text = getNewTextNode()
            text.content = content.substring(node.position.start.absIndex, start)
            result.push(text)

            span = getNewSpanNode()
            text = getNewTextNode()
            text.content = content.substring(start, node.position.end.absIndex + 1)
            span.children.push(text)
            span = setAttributes(span, attributes)
            result.push(span)

            selectionNode = span
            done = false
          }
        } else {
          result.push(JSON.parse(JSON.stringify(node))) // TODO better to take copy of node
          done = false
        }
      } else if (node.position.start.absIndex > start) {
        if (node.position.start.absIndex <= end) {
          if (node.position.end.absIndex == end) {
            span = selectionNode
            text = getNewTextNode()
            text.content = content.substring(node.position.start.absIndex, node.position.end.absIndex + 1)
            span.children.push(text)
            done = true
          } else if (node.position.end.absIndex > end) {
            span = selectionNode
            text = getNewTextNode()
            text.content = content.substring(node.position.start.absIndex, end + 1)
            span.children.push(text)

            text = getNewTextNode()
            text.content = content.substring(end + 1, node.position.end.absIndex + 1)
            result.push(text)

            done = true
          } else if (node.position.end.absIndex < end) {
            span = selectionNode
            text = getNewTextNode()
            text.content = content.substring(node.position.start.absIndex, node.position.end.absIndex + 1)
            span.children.push(text)

            done = false
          }
        } else {
          // This case should not occur. Done should be already true by this time.
          result.push(JSON.parse(JSON.stringify(node))) // TODO better to take copy of node
          done = true
        }
      }

      break

    case 'element':

      if (node.tagName == 'span') {
        if (node.children && node.children.length) {
          var childNodes = node.children
          var originalAttributes = JSON.parse(JSON.stringify(node.attributes)) // TODO: clone this. Do not use copy.
          var originalAttributesJson = convertHimalayaAtrributes(originalAttributes)
          var currentSpan = getNewSpanNode()
          currentSpan.attributes = originalAttributes
          var currentSpanTemplate = JSON.parse(JSON.stringify(currentSpan)) // TODO clone currentSpan

          for (var i = 0; i < childNodes.length; i++) {
            // if done the just loop through remaining children and push into result. //Looks like already done after each done. Just skip if done

            var childNode = childNodes[i]

            switch (childNode.type) {
              case 'text':

                if (childNode.position.start.absIndex == start) {
                  if (childNode.position.end.absIndex == end) {
                    span = getNewSpanNode()
                    span.children.push(JSON.parse(JSON.stringify(childNode))) // TODO better to take copy of childnode
                    span = setAttributes(span, attributes, originalAttributesJson)
                    result.push(span)

                    done = true

                    var currentSpanClone = JSON.parse(JSON.stringify(currentSpanTemplate)) // TODO clone currentSpanTemplate
                    node.children.forEach(function (n, idx) {
                      if (idx != i) {
                        currentSpanClone.children.push(n)
                      }
                    })
                    result.push(currentSpanClone)
                  } else if (childNode.position.end.absIndex > end) {
                    span = getNewSpanNode()
                    text = getNewTextNode()
                    text.content = content.substring(start, end + 1)
                    span.children.push(text)
                    span = setAttributes(span, attributes, originalAttributesJson)
                    result.push(span)

                    done = true

                    var currentSpanClone = JSON.parse(JSON.stringify(currentSpanTemplate)) // TODO clone currentSpanTemplate
                    text = getNewTextNode()
                    text.content = content.substring(end + 1, childNode.position.end.absIndex + 1)
                    currentSpanClone.children.push(text)
                    node.children.forEach(function (n, idx) {
                      if (idx != i) {
                        currentSpanClone.children.push(n)
                      }
                    })
                    result.push(currentSpanClone)
                  } else if (childNode.position.end.absIndex < end) {
                    span = getNewSpanNode()
                    text = getNewTextNode()
                    text.content = content.substring(start, childNode.position.end.absIndex + 1)
                    span.children.push(text)
                    span = setAttributes(span, attributes, originalAttributesJson)
                    result.push(span)

                    selectionNode = span
                    done = false
                  }
                } else if (childNode.position.start.absIndex < start) {
                  if (childNode.position.end.absIndex >= start) {
                    if (childNode.position.end.absIndex == end) {
                      text = getNewTextNode()
                      text.content = content.substring(childNode.position.start.absIndex, start)
                      var currentSpanClone = JSON.parse(JSON.stringify(currentSpanTemplate))
                      currentSpanClone.children.push(text)
                      result.push(currentSpanClone)

                      span = getNewSpanNode()
                      text = getNewTextNode()
                      text.content = content.substring(start, childNode.position.end.absIndex + 1)
                      span.children.push(text)
                      span = setAttributes(span, attributes, originalAttributesJson)
                      result.push(span)

                      done = true

                      var currentSpanClone = JSON.parse(JSON.stringify(currentSpanTemplate)) // TODO clone currentSpanTemplate
                      for (var j = i + 1; j < childNodes.length; j++) {
                        currentSpanClone.children.push(childNodes[i])
                      }
                      result.push(currentSpanClone)
                    } else if (childNode.position.end.absIndex > end) {
                      text = getNewTextNode()
                      text.content = content.substring(childNode.position.start.absIndex, start)
                      var currentSpanClone = JSON.parse(JSON.stringify(currentSpanTemplate))
                      currentSpanClone.children.push(text)
                      result.push(currentSpanClone)

                      span = getNewSpanNode()
                      text = getNewTextNode()
                      text.content = content.substring(start, end + 1)
                      span.children.push(text)
                      span = setAttributes(span, attributes, originalAttributesJson)
                      result.push(span)

                      done = true

                      var currentSpanClone = JSON.parse(JSON.stringify(currentSpanTemplate)) // TODO clone currentSpanTemplate

                      text = getNewTextNode()
                      text.content = content.substring(end + 1, childNode.position.end.absIndex + 1)
                      currentSpanClone.children.push(text)

                      for (var j = i + 1; j < childNodes.length; j++) {
                        currentSpanClone.children.push(childNodes[i])
                      }
                      result.push(currentSpanClone)
                    } else if (childNode.position.end.absIndex < end) {
                      text = getNewTextNode()
                      text.content = content.substring(childNode.position.start.absIndex, start)
                      var currentSpanClone = JSON.parse(JSON.stringify(currentSpanTemplate))
                      currentSpanClone.children.push(text)
                      result.push(currentSpanClone)

                      span = getNewSpanNode()
                      text = getNewTextNode()
                      text.content = content.substring(start, childNode.position.end.absIndex + 1)
                      span.children.push(text)
                      span = setAttributes(span, attributes, originalAttributesJson)
                      result.push(span)

                      selectionNode = span
                      done = false
                    }
                  } else {
                    var currentSpanClone = JSON.parse(JSON.stringify(currentSpanTemplate))
                    currentSpanClone.children.push(childNode)
                    result.push(currentSpanClone)
                  }
                } else if (childNode.position.start.absIndex > start) {
                  if (childNode.position.start.absIndex <= end) {
                    if (childNode.position.end.absIndex == end) {
                      span = getSelectionNode(originalAttributesJson, attributes, result)// selectionNode;
                      text = getNewTextNode()
                      text.content = content.substring(childNode.position.start.absIndex, end + 1)
                      span.children.push(text)

                      done = true

                      var currentSpanClone = JSON.parse(JSON.stringify(currentSpanTemplate)) // TODO clone currentSpanTemplate
                      for (var j = i + 1; j < childNodes.length; j++) {
                        currentSpanClone.children.push(childNodes[i])
                      }
                      result.push(currentSpanClone)
                    } else if (childNode.position.end.absIndex > end) {
                      span = getSelectionNode(originalAttributesJson, attributes, result)// selectionNode;
                      text = getNewTextNode()
                      text.content = content.substring(childNode.position.start.absIndex, end + 1)
                      span.children.push(text)

                      done = true

                      var currentSpanClone = JSON.parse(JSON.stringify(currentSpanTemplate)) // TODO clone currentSpanTemplate

                      text = getNewTextNode()
                      text.content = content.substring(end + 1, childNode.position.end.absIndex + 1)
                      currentSpanClone.children.push(text)

                      for (var j = i + 1; j < childNodes.length; j++) {
                        currentSpanClone.children.push(childNodes[i])
                      }
                      result.push(currentSpanClone)
                    } else if (childNode.position.end.absIndex < end) {
                      span = getSelectionNode(originalAttributesJson, attributes, result)// selectionNode;
                      text = getNewTextNode()
                      text.content = content.substring(childNode.position.start.absIndex, childNode.position.end.absIndex + 1)
                      span.children.push(text)

                      done = false
                    }
                  } else {

                    // This case should not occur.

                  }
                }

                break

              case 'element':

                // Only br possible
                if (selectionNode && !done) {
                  selectionNode.children.push(childNode)
                } else {
                  result.push(childNode)
                }

                break
            }
          }
        }
      } else if (node.tagName == 'br') {
        if (selectionNode && !done) {
          selectionNode.children.push(node)
        } else {
          result.push(node)
        }
      }

      break
  }

  return result
}

// Starting point.
export function updateJson (mode, jsonArray, text, range, attributes) {
  var result = []
  var currentIdx = 0
  content = text
  operationMode = mode
  // Loop through each node and call processNode;
  for (var i = 0; i < jsonArray.length; i++) {
    currentIdx = i
    if (!done) {
      var node = jsonArray[i]
      result = result.concat(processNode(node, range.start, range.end, attributes))
      if (done) {
        currentIdx++
      }
    } else {
      break
    }
  }

  for (var i = currentIdx; i < jsonArray.length; i++) {
    result.push(jsonArray[i])
  }

  return result // Final new himalayan json;
}

function getStyleAttributes (attributes) {
  if (!attributes || !attributes.length) { return {} }

  for (var i = 0; i < attributes.length; i++) {
    if (attributes[i].key == 'style') {
      return styleToJson(attributes[i].value)
    }
  }
}

export function getRangeAttributes (tokens, range) {
  var result = []
  var start = range.start
  var end = range.end

  for (var i = 0; i < tokens.length; i++) {
    var node = tokens[i]
    if (node.type == 'element' && node.tagName == 'span') {
      if (node.children && node.children.length) {
        var childNodes = node.children
        for (var j = 0; j < childNodes.length; j++) {
          var childNode = childNodes[j]
          if (childNode.type == 'text') {

            if(start > childNode.position.start.absIndex && end < childNode.position.end.absIndex) {
              result.push({
                range: {
                  start: start,
                  end: end
                },
                attributes: {
                  style: getStyleAttributes(node.attributes)
                }
              })
            } else if (childNode.position.start.absIndex >= start && childNode.position.start.absIndex <= end) {
              result.push({
                range: {
                  start: childNode.position.start.absIndex > start ? childNode.position.start.absIndex : start,
                  end: childNode.position.end.absIndex < end ? childNode.position.end.absIndex : end
                },
                attributes: {
                  style: getStyleAttributes(node.attributes)
                }
              })
            } else if (childNode.position.end.absIndex >= start && childNode.position.end.absIndex <= end) {
              result.push({
                range: {
                  start: childNode.position.start.absIndex > start ? childNode.position.start.absIndex : start,
                  end: childNode.position.end.absIndex < end ? childNode.position.end.absIndex : end
                },
                attributes: {
                  style: getStyleAttributes(node.attributes)
                }
              })
            }
          }
        }
      }
    } else {
      if (node.position.start.absIndex >= start && node.position.start.absIndex <= end) {
        result.push({
          range: {
            start: node.position.start.absIndex > start ? node.position.start.absIndex : start,
            end: node.position.end.absIndex < end ? node.position.end.absIndex : end
          },
          attributes: {
            style: getStyleAttributes(node.attributes)
          }
        })
      } else if (node.position.end.absIndex >= start && node.position.end.absIndex <= end) {
        result.push({
          range: {
            start: node.position.start.absIndex > start ? node.position.start.absIndex : start,
            end: node.position.end.absIndex < end ? node.position.end.absIndex : end
          },
          attributes: {
            style: getStyleAttributes(node.attributes)
          }
        })
      }
    }
  }

  return result
}
