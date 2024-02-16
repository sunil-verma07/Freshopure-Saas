class ErrorHandler extends Error{
    constructor(error,statusCode){
        super(error);
        this.statusCode = statusCode
        this.error = error.message;
        Error.captureStackTrace(this,this.constructor);

    }
    
}

module.exports = ErrorHandler