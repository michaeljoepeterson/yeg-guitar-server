const mongoose = require('mongoose');

const categorySchema = mongoose.Schema({
    name:{type:String,required:true},
});

categorySchema.methods.serialize = function(){
	return {
		id:this._id,
        name:this.name
	};
};

const Category = mongoose.model("Category",categorySchema);

module.exports = {Category};