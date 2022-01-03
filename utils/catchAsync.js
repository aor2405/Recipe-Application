//  We pass in a function into func
module.exports = func => {
    // We return a new function that has 'func' executed and return it
    return (req, res, next) => {
        // It catches any errors and passes them to next
        func(req, res, next).catch(next);
    }
}