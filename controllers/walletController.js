const Wallet = require("../modals/wallet");
const User = require("../modals/users"); // Needed to ensure user exists

module.exports = {
  // Get the authenticated user's wallet balance
  getWalletBalance: async (req, res, next) => {
    try {
      const userId = req.user.id;
      let wallet = await Wallet.findOne({ userId });

      if (!wallet) {
        // If no wallet exists, create one for the user
        // This ensures every user can have a wallet when they first check.
        const user = await User.findById(userId);
        if (!user) {
          return res.status(404).json({ status: false, message: "User not found, cannot create wallet." });
        }
        wallet = new Wallet({ userId, balance: 0 });
        await wallet.save();
      }

      res.status(200).json({ status: true, wallet });
    } catch (error) {
      console.error("Error fetching wallet balance:", error);
      return next(error);
    }
  },

  // Internal function to update a user's wallet.
  // This would be called by other controllers/services (e.g., after a product sale)
  // Not directly exposed as an API endpoint for now.
  /**
   * Updates a user's wallet balance.
   * @param {string} userId - The ID of the user whose wallet is to be updated.
   * @param {number} amount - The amount to add (positive) or subtract (negative).
   * @param {string} transactionType - Description of the transaction (e.g., "product_sale", "product_purchase", "refund").
   * @returns {Promise<object>} The updated wallet object or throws an error.
   */
  updateUserWallet: async (userId, amount, transactionType) => {
    // For now, this is a placeholder.
    // In a real application, you'd have a WalletTransactions model to log each change.
    console.log(
      `Attempting to update wallet for userId: ${userId}, amount: ${amount}, type: ${transactionType}`
    );

    if (typeof amount !== 'number' || isNaN(amount)) {
        throw new Error("Invalid amount for wallet transaction.");
    }

    let wallet = await Wallet.findOne({ userId });

    if (!wallet) {
      // Optionally create a wallet if it doesn't exist, or throw an error
      // For critical transactions like sales, it's better to ensure the user/wallet exists beforehand.
      // For this internal function, let's assume a wallet should exist or be creatable.
      const user = await User.findById(userId);
      if (!user) {
          throw new Error(`User with ID ${userId} not found. Cannot update wallet.`);
      }
      wallet = new Wallet({ userId, balance: 0 });
    }

    // Add the amount (can be negative for deductions)
    const newBalance = wallet.balance + amount;

    if (newBalance < 0) {
      // This check prevents overdrafts if business logic dictates.
      // For a sale, the seller's balance should only increase.
      // For a purchase, the buyer's balance would decrease.
      throw new Error(
        `Insufficient funds for user ${userId}. Current balance: ${wallet.balance}, trying to deduct: ${Math.abs(amount)}`
      );
    }

    wallet.balance = newBalance;
    wallet.updatedAt = Date.now();
    await wallet.save();

    console.log(
      `Wallet updated successfully for userId: ${userId}. New balance: ${wallet.balance}`
    );
    // TODO: In a full implementation, create a WalletTransaction record here.
    return wallet;
  },
};
