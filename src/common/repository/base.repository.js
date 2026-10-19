export const findById = async ({
        id,
        options,
        model
}) => {
    const doc = model.findById(id);
    if (options?.select) {
        doc.select(options.select);
    }
    if (options?.populate) {
        doc.populate(options.populate);
    }
    if (options?.lean) {
        doc.lean(options.lean);
    }
    return await doc.exec();
}

export const findOne = async ({
    filter,
    options,
    model
} = {}) => {
    const doc = model.findOne(filter);
    if (options?.select) {
        doc.select(options.select);
    }
    if (options?.populate) {
        doc.populate(options.populate);
    }
    if (options?.lean) {
        doc.lean(options.lean);
    }
    return await doc.exec();
}

export const find = async ({
    filter,
    options,
    model
} = {}) => {
    const doc = model.find(filter || {});
    if (options?.select) {
        doc.select(options.select);
    }
    if (options?.populate) {
        doc.populate(options.populate);
    }
    if (options?.skip) {
        doc.skip(options.skip);
    }
    if (options?.limit) {
        doc.limit(options.limit);
    }
    if (options?.sort) {
        doc.sort(options.sort);
    }
    if (options?.lean) {
        doc.lean(options.lean);
    }
    return await doc.exec();
}
export const countDoc = async({model , filter = {}})=>{
    return await model.countDocuments(filter)
}
export const paginate = async ({
    model , 
    filter = {},
    options = {},
    page,
    limit
})=>{
    const skip = (page - 1) * limit;
    const countMessage = await countDoc({model, filter})
    const pages = Math.ceil(countMessage / limit)
    
    const docs = await find({
        model,
        filter,
        options:{
            ...options,
            skip,
            limit,
        }
    })
    return {countMessage, pages ,  page , limit ,  docs}
}
export const create = async ({
    data,
    options,
    model

}) => {
    return await model.create(data, options) || [];
}

export const insertMany = async ({
    data,
    model

}) => {
    return (await model.insertMany(data))
}

export const updateOne = async ({
    filter,
    update,
    options,
    model

} = {}) => {
    if (Array.isArray(update)) {
        update.push({
        $set: {
            __v: { $add: ["$__v", 1] },
        },
    });
        return await model.updateOne(filter || {}, update, { ...options, runValidators: true, updatePipeline: true });
    } 

    return await model.updateOne(
        filter || {},
        { ...update, $inc: { __v: 1 } },
        options
    );
}

export const findOneAndUpdate = async ({
    filter,
    update,
    options,
    model

} = {}) => {
    if (Array.isArray(update)) {
        update.push({
        $set: {
            __v: { $add: ["$__v", 1] },
        },
    });
        return await model.findOneAndUpdate(filter || {}, update, {
        returnDocument: "after",
        runValidators: true,

        ...options,
        updatePipeline: true,
        }
        );
    }
    return await model.findOneAndUpdate(
        filter || {},
        { ...update, $inc: { __v: 1 } },
        {
        returnDocument: "after",
        runValidators: true,

        ...options,
        }
    );
}

export const findByIdAndUpdate = async ({
    id,
    update,
    options = { new: true },
    model

}) => {
    return await model.findByIdAndUpdate(
        id,
        { ...update, $inc: { __v: 1 } },
        options
    );
}

export const deleteOne = async ({
    filter,
    model

}) => {
    return await model.deleteOne(filter || {});
}     

export const deleteMany = async ({
    filter,
    model

}) => {
    return await model.deleteMany(filter || {});
}

export const findOneAndDelete = async ({
    filter,
    model

} = {}) => {
    return await model.findOneAndDelete(
        filter || {},
    );
}