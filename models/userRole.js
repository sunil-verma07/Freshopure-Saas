const mongoose = require('mongoose');

const UserRoleSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: 'User id is required for userRole',
    },
    roleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Role',
        required: 'Role id is required for userRole',
    },
});

module.exports = mongoose.model('UserRole', UserRoleSchema);