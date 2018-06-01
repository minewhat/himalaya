// var lexer = require('./lib/index')
// var jsonModifier = require('./lib/caiparser')

// const str = "This is just a <span class='no-reset' style='color:#0000ff;font-weight:bold;'>sample te</span><span class='no-reset' style='color:#0000ff;font-style:italic;'>xt written</span> to test all cases";
// const content = "This is just a sample text written to test all cases";
// const options = {childlessTags: []}
// const tokens = lexer.parse(str)

// // console.log(JSON.stringify(tokens))

// var range = {
//     'start': 23,
//     'end': 24
// }

// var attributes = {
//     'style': {
//         'color': '#ff0000',
//     },
//     'class': 'no-reset'
// }

// var updatedJson = jsonModifier.default(tokens, content, range, attributes);

// // console.log("****************************** UPDATED JSON ************************************");
// console.log(updatedJson);

// var finalStr = lexer.stringify(updatedJson);

// console.log(finalStr);


var lexer = require('./lib/index')
var jsonModifier = require('./lib/caiparser')

const str = " Hand picked<br><span style='color:blue'>items</span> for<br>this season ";
const content = " Hand pickeditems forthis season ";
const options = {childlessTags: []}
const tokens = lexer.parse(str)

// console.log(JSON.stringify(tokens))

var range = {
    'start': 9,
    'end': 15
}

console.log(JSON.stringify(jsonModifier.getRangeAttributes(tokens, range)));

var attributes = {
    'class': 'no-reset',
    'style': {
        'color': '#ff0000',
    }
}

var mode = "update";

var updatedJson = jsonModifier.updateJson(mode, tokens, content, range, attributes);

// console.log("****************************** UPDATED JSON ************************************");
// console.log(updatedJson);

var finalStr = lexer.stringify(updatedJson);

console.log(finalStr);
