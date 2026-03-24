let userModel = require("../schemas/users");
let bcrypt = require('bcrypt');
let roleModel = require("../schemas/roles");
const ExcelJS = require('exceljs');
const crypto = require('crypto');
const mailHandler = require('../utils/mailHandler');

module.exports = {
    CreateAnUser: async function (username, password, email, role,session,
        fullName, avatarUrl, status, loginCount
    ) {
        let newUser = new userModel({
            username: username,
            password: password,
            email: email,
            fullName: fullName,
            avatarUrl: avatarUrl,
            status: status,
            role: role,
            loginCount: loginCount
        })
        await newUser.save({session});
        return newUser;
    },
    FindUserByUsername: async function (username) {
        return await userModel.findOne({
            isDeleted: false,
            username: username
        })
    }, FindUserByEmail: async function (email) {
        return await userModel.findOne({
            isDeleted: false,
            email: email
        })
    },
    FindUserByToken: async function (token) {
        let result =  await userModel.findOne({
            isDeleted: false,
            forgotPasswordToken: token
        })
        if(result.forgotPasswordTokenExp>Date.now()){
            return result;
        }
        return false
    },
    CompareLogin: async function (user, password) {
        if (bcrypt.compareSync(password, user.password)) {
            user.loginCount = 0;
            await user.save()
            return user;
        }
        user.loginCount++;
        if (user.loginCount == 3) {
            user.lockTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
            user.loginCount = 0;
        }
        await user.save()
        return false;
    },
    GetUserById: async function (id) {
        try {
            let user = await userModel.findOne({
                _id: id,
                isDeleted: false
            }).populate('role')
            return user;
        } catch (error) {
            return false;
        }
    },
    ImportUsersFromExcel: async function () {
        try {
            let userRole = await roleModel.findOne({ name: 'user' });
            if (!userRole) {
                userRole = new roleModel({ name: 'user', description: 'Normal user' });
                await userRole.save();
            }
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.readFile('./user.xlsx');
            const worksheet = workbook.getWorksheet(1);
            let count = 0;
            for (let i = 2; i <= worksheet.rowCount; i++) {
                const row = worksheet.getRow(i);
                const username = row.getCell(1).text ? row.getCell(1).text.trim() : row.getCell(1).value;
                const email = row.getCell(2).text ? row.getCell(2).text.trim() : row.getCell(2).value;
                
                if (username && email) {
                    let existingUser = await userModel.findOne({ $or: [{ username }, { email }] });
                    if (!existingUser) {
                        const password = crypto.randomBytes(8).toString('hex');
                        let newUser = new userModel({
                            username: username,
                            password: password,
                            email: email,
                            role: userRole._id
                        });
                        console.log(`[Import] Bắt đầu lưu user thứ ${i - 1} / ${worksheet.rowCount - 1}: ${username}`);
                        await newUser.save();
                        
                        console.log(`[Import] Đang gửi email cho ${email}...`);
                        await mailHandler.sendPasswordEmail(email, username, password);
                        count++;
                    } else {
                        console.log(`[Import] Bỏ qua user thứ ${i - 1}: ${username} (đã tồn tại)`);
                    }
                }
            }
            return { success: true, message: `Imported ${count} users successfully.` };
        } catch (error) {
            console.error("Error importing users:", error);
            throw error;
        }
    }
}