import mongoose from "mongoose";
import User from "../models/User.js";
import Transaction from "../models/Transaction.js";

// Get Admin
export const getAdmins = async (req, res) => {
  try {
    const admins = await User.find({ role: "admin" }).select("-password");
    res.status(200).json(admins);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Terjadi kesalahan dalam mengambil admin." });
  }
};

// Get User Performance
export const getUserPerformance = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID pengguna tidak valid." });
    }

    const userWithStats = await User.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(id) } },
      {
        $lookup: {
          from: "affiliatestats",
          localField: "_id",
          foreignField: "userId",
          as: "affiliateStats",
        },
      },
      { $unwind: "$affiliateStats" },
    ]);

    if (!userWithStats || userWithStats.length === 0) {
      return res.status(404).json({ message: "Pengguna tidak ditemukan." });
    }

    if (
      !userWithStats[0].affiliateStats ||
      !userWithStats[0].affiliateStats.affiliateSales
    ) {
      return res.status(200).json({ user: userWithStats[0], sales: [] });
    }

    const saleTransactions = await Promise.all(
      userWithStats[0].affiliateStats.affiliateSales.map((id) => {
        return Transaction.findById(id);
      })
    );

    const filteredSaleTransactions = saleTransactions.filter(
      (transaction) => transaction !== null
    );

    res.status(200).json({
      user: userWithStats[0],
      sales: filteredSaleTransactions,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Terjadi kesalahan dalam mengambil kinerja pengguna." });
  }
};
