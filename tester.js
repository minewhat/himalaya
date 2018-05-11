var lexer = require('./lib/lexer')

const str = '<h1>Test case <p>para</p> remaining <span>spantext</span> last part</h1>'
const options = {childlessTags: []}
const tokens = lexer.lexer(str, options)

console.log(JSON.stringify(tokens))
