const mongoose = require('mongoose');

const RoleSchema = new mongoose.Schema({
    name: {
        type: String,
        required:'Role name is required',
    }
});

module.exports = mongoose.model('Role', RoleSchema,'Roles');