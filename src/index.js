import lexer from './lexer'
import caiparser from './caiparser'
import parser from './parser'
import {format} from './format'
import {toHTML} from './stringify'
import {
  voidTags,
  closingTags,
  childlessTags,
  closingTagAncestorBreakers
} from './tags'

export const parseDefaults = {
  voidTags,
  closingTags,
  childlessTags,
  closingTagAncestorBreakers,
  includePositions: false
}

export function parse (str, options = parseDefaults) {
  const tokens = lexer(str, options)
  const nodes = parser(tokens, options)
  return format(nodes, options)
}

export function stringify (ast, options = parseDefaults) {
  return toHTML(ast, options)
}

export function updateJson(mode, jsonArray, text, range, attributes) {
  return caiparser.updateJson(mode, jsonArray, text, range, attributes);
}

export function getRangeAttributes(tokens, range) {
  return caiparser.getRangeAttributes(tokens, range);
}