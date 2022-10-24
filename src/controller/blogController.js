const blogModel = require('../models/blogModel')
const authorModel = require('../models/authorModel')
const mongoose = require('mongoose')

const isValidObjectId = (ObjectId) => {
    return mongoose.Types.ObjectId.isValid(ObjectId)
}
const stringChecking = function (data) {
    if (typeof data !== 'string') {
        return false;
    } else if (typeof data === 'string' && data.trim().length === 0) {
        return false;
    } else {
        return true;
    }
}

const arrayOfStringChecking = function (data) {
    for (let i = 0; i < data.length; i++) {
        if (typeof data[i] !== 'string') {
            return false;
        } else if (typeof data[i] === 'string' && data[i].trim().length == 0) {
            return false;
        }
    }
    return true
}



const createBlogs = async function (req, res) {
    try {
        const data = req.body
        if (Object.keys(data).length === 0) {
            return res.status(400).send({ status: false, msg: "Please enter details for creating a blog" })
        }
        else {
            const { title, authorId, body, subcategory, category, tags } = data

            if (!isValidObjectId(authorId)) return res.status(400).send({ status: false, msg: `Author Id: ${authorId} is not valid, please enter valid authorId` })

            if (!stringChecking(title)) return res.status(400).send({ status: false, msg: "title  must be present and have Non empty string " })

            if (!stringChecking(body)) return res.status(400).send({ status: false, msg: " body must be present and have Non empty string " })

            if (!arrayOfStringChecking(category)) return res.status(400).send({ status: false, msg: "category must be present and have Non empty string " })

            if (subcategory) {
                if (!arrayOfStringChecking(subcategory)) return res.status(400).send({ status: false, msg: "subcategory must be present and have Non empty string " })
            }
            if (tags) {
                if (!arrayOfStringChecking(tags)) return res.status(400).send({ status: false, msg: "tags must be present and have Non empty string " })
            }

            let checkauthorId = await authorModel.findById(authorId)
            if (!checkauthorId) {
                return res.status(404).send({ status: false, data: "Author ID not Found.....please Enter valid Author ID" })
            }
            else {
                let userLoggedIn = (req.decodedToken.authorId).toString()
                if (data.authorId === userLoggedIn) {
                    let createData = await blogModel.create(data)
                    return res.status(201).send({ status: true, data: createData })
                }
                else {
                    return res.status(403).send({ status: false, msg: "Cannot create blog as user not authorised please enter valid authorId" })
                }
            }
        }
    }
    catch (err) {
        return res.status(500).send({ status: false, error: err.message })
    }
}

const getBlog = async function (req, res) {
    try {
        const data = req.query

        if (Object.keys(data).length == 0) {
            let getData = await blogModel.find({ isDeleted: false, deletedAt: null, isPublished: true })
            if (getData.length <= 0) {
                return res.status(404).send({ status: false, msg: "No entries are there to show you!" })
            }
            return res.status(200).send({ status: true, count: getData.length, data: getData })
        }
        else {
            const { subcategory, category, tags, authorId } = data
            const filter = {}
            if (subcategory) {
                filter.subcategory = subcategory
            }
            if (tags) {
                filter.tags = tags
            }
            if (category) {
                filter.category = category
            }
            if (authorId) {
                if (!isValidObjectId(authorId)) return res.status(400).send({ status: false, msg: `AuthorId: ${authorId} is not valid, please enter valid authorId` })
                filter.authorId = authorId
            }
            filter.isDeleted = false
            filter.isPublished = true
            if (subcategory || category || tags || authorId) {
                let getDataByFilter = await blogModel.find(filter)
                return res.status(200).send({ status: true, count: getDataByFilter.length, data: getDataByFilter })
            }
            else {
                return res.status(400).send({ status: false, msg: "filters can be subcategory, category, tags, authorId only " })
            }
        }
    }
    catch (err) {
        return res.status(500).send({ status: false, error: err.message })
    }
}

const updateBlogs = async function (req, res) {
    try {
        const blogId = req.params.blogId
        const data = req.body
        const { subcategory, tags, body, title } = data
        if (Object.keys(data).length === 0) {
            return res.status(400).send({ status: false, msg: "Please enter required details in request body" })
        }
        if (subcategory) {
            if (!arrayOfStringChecking(subcategory)) return res.status(400).send({ status: false, msg: "subcategory must  have Non empty string " })
        }
        if (tags) {
            if (!arrayOfStringChecking(tags)) return res.status(400).send({ status: false, msg: "tags must have Non empty string " })
        }

        if (title) {
            if (!stringChecking(title)) return res.status(400).send({ status: false, msg: "title must be Non empty string " })
        }

        if (body) {
            if (!stringChecking(body)) return res.status(400).send({ status: false, msg: "body must have Non empty string " })
        }

        const validBlogId = await blogModel.findById(blogId)
        if (validBlogId === null) {
            return res.status(404).send({ status: false, msg: "Invalid blogId, Id not found " })
        } else if (validBlogId.isDeleted === true) {
            return res.status(400).send({ status: false, msg: " Blog is already deleted" })
        } else {
            const updateUser = await blogModel.findOneAndUpdate(
                { "_id": blogId },
                { "$set": { "title": title, "body": body }, "$addToSet": { "tags": tags, "subcategory": subcategory }, isPublished: true, publishedAt: new Date() },
                { new: true }
            )
            return res.status(200).send({ status: true, message: "Updated Successfully", data: updateUser })
        }

    } catch (error) {
        return res.status(500).send({ status: false, error: error.message })
    }
}



const deleteBlog = async function (req, res) {
    try {
        const blogId = req.params.blogId;

        const checkblog = await blogModel.findById(blogId);
        if (checkblog === null || checkblog.isDeleted == true) {
            return res.status(400).send({ status: false, msg: "Blog already deleted" });
        } else {
            await blogModel.findByIdAndUpdate(blogId, {
                $set: { isDeleted: true, deletedAt: new Date() },
            });
            return res.status(200).send({ status: true, msg: "Deleted" });
        }
    }
    catch (err) {
        return res.status(500).send({ status: false, error: err.message });
    }
};


const deleteByQuery = async function (req, res) {

    try {
        const data = req.query
        const tokenAuthorId = (req.decodedToken.authorId).toString()
        if (Object.keys(data).length === 0) {
            return res.status(404).send({ status: false, msg: "Please enter a filter to delete" })
        }
        const { category, subcategory, tags, authorId } = data
        const filter = {}
        if (subcategory) {
            filter.subcategory = subcategory
        }
        if (tags) {
            filter.tags = tags
        }
        if (category) {
            filter.category = category
        }
        if (authorId) {
            if (!isValidObjectId(authorId)) return res.status(400).send({ status: false, msg: "please enter valid authorId" })
            if (authorId !== tokenAuthorId) {
                return res.status(403).send({ status: false, msg: "Person is not authorised" })
            }
            filter.authorId = authorId
        }
       
        if (!subcategory && !category && !tags && !authorId) {
            return res.status(400).send({ status: false, msg: "filters can be subcategory, category, tags, authorId only " })
        } else {
            const blog = await blogModel.find(filter).select({ authorId: 1, _id: 0 })
            if (blog.length === 0) return res.status(404).send({ status: false, msg: "Blog not found" })
            for (let i = 0; i < blog.length; i++) {
                if (blog[i].authorId.toString() === tokenAuthorId) {
                    filter.authorId = blog[i].authorId
                    filter.isDeleted = false
                    filter.isPublished = false
                    const deleteByQuery = await blogModel.updateMany(
                        filter,
                        { $set: { isDeleted: true, deletedAt: new Date() } }
                    )
                    if (deleteByQuery.modifiedCount === 0) {
                        return res.status(404).send({ status: false, msg: "Nothing to delete, already deleted" })
                    }
                    return res.status(200).send({ status: true, msg: "deleted" })
                }
            }
            return res.status(403).send({status: false, message: "You are not an authorised person"})
        }
    } catch (error) {
        return res.status(500).send({ status: false, error: error.message });
    }
}


module.exports = { createBlogs, getBlog, updateBlogs, deleteBlog, deleteByQuery }