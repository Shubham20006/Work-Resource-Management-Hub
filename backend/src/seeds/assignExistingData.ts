import bcrypt from 'bcryptjs';
import { CardModel } from '../models/Card.js';
import { UserModel } from '../models/User.js';

export const assignExistingDataToDefaultUser = async (): Promise<void> => {
  try {
    const targetEmails = [
      'shubham.chaudhari@bridgelabz.com',
    ];
    const defaultPassword = 'Shubham@1234';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(defaultPassword, salt);

    let primaryUser: any = null;

    for (const email of targetEmails) {
      let user = await UserModel.findOne({ email });
      if (!user) {
        user = await UserModel.create({
          name: 'Shubham Chaudhari',
          email,
          password: hashedPassword,
        });
        console.log(`✅ Default user account created for ${email}`);
      }
      if (!primaryUser) primaryUser = user;
    }

    if (primaryUser) {
      // Assign any unassigned cards to primary default user
      const result = await CardModel.updateMany(
        { $or: [{ userId: { $exists: false } }, { userId: null }] },
        { $set: { userId: primaryUser._id } }
      );

      if (result.modifiedCount > 0) {
        console.log(
          `✅ Successfully assigned ${result.modifiedCount} existing cards to ${primaryUser.email}.`
        );
      }
    }
  } catch (error) {
    console.error('Error in assignExistingDataToDefaultUser migration:', error);
  }
};
