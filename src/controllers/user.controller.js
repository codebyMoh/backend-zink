const { code } = require("../../constant/code");
const { googleLoginAuth } = require("../configuration/googleConfig");
const { db } = require("../model/index");
const {
  getSolanaPhrase,
  getSolanaPk,
  encryptDataForFrontEnd,
  convertSolPKInString,
} = require("../services/encryption");
const { generateEVM } = require("../services/generateEVMWallet");
const { generateOtp } = require("../services/generateOtp");
const { generateSolWallet } = require("../services/generateSolWallet");
const { splitIntoThreeParts } = require("../services/partationPK");
const { apiResponse } = require("../utils/apiResponse");
const { transporter } = require("../utils/sendMail");
const ThrowError = require("../utils/ThrowError");
const bqToken = process.env.BITQUERY_API_KEY;
const { default: axios } = require("axios");
const { PublicKey } = require("@solana/web3.js");
const nacl = require("tweetnacl");
const { default: Moralis } = require("moralis");
const {
  createWalletInTurnKey,
  createWalletInTurnKeyEvm,
} = require("../services/turnkey/createWalletOnTurnkey");
const {
  importWalletSeedPhrase,
} = require("../services/turnkey/importWalletPhrase");
const {
  generateSolWalletWithSamePhrase,
} = require("../services/generateWalletUsingPhrase/generateWalletSol");

async function userDetails(req, res) {
  const user = req.user;
  const findUser = await db?.user
    ?.findById(user?._id)
    .select(
      "email walletAddressSOL referralId lastLogin phantomAddress tradePoints dailyPoints weeklyPoints refferalPoints referralEdit referredBy"
    );
  if (!findUser) {
    return ThrowError(code.NOT_FOUND, "User not found.");
  }
  return apiResponse(res, code.SUCCESS, "User found.", {
    user: {
      email: findUser?.email,
      walletAddressSOL: findUser?.walletAddressSOL,
      referralId: findUser?.referralId,
      lastLogin: findUser?.lastLogin,
      phantomAddress: findUser?.phantomAddress,
      tradePoints: findUser?.tradePoints,
      dailyPoints: findUser?.dailyPoints,
      weeklyPoints: findUser?.weeklyPoints,
      referralPoints: findUser?.refferalPoints,
      referralEdit: findUser?.referralEdit,
      referredBy: findUser?.referredBy,
    },
  });
}

// signup
async function signup(req, res) {
  const { email, referralId } = req.body;
  if (!email) {
    return ThrowError(code.BAD_REQUEST, "All fields are required.");
  }
  let referralUser = null;
  if (referralId) {
    referralUser = await db?.user?.findOne({ referralId });
    if (!referralUser?.email) {
      return ThrowError(code.BAD_REQUEST, "Invalid invite code.");
    }
  }
  const otp = await generateOtp();

  // check is user exists
  const isUserExist = await db?.user?.findOne({ email });
  if (isUserExist?.email) {
    // If email is already exist on DB
    if (isUserExist?.verify) {
      // If email is already verify
      return ThrowError(code.BAD_REQUEST, "User already register.");
    } else {
      // If email is not verify but exist in DB so send OTP to verify again
      const mailOptions = {
        from: "test.project7312@gmail.com",
        to: email,
        subject: "Email OTP Verification",
        html: `<p>OTP : <h1>${otp}</h1></p>`,
      };
      await transporter.sendMail(mailOptions, function (err, info) {
        if (err) {
          return ThrowError(
            code.INTERNAL_SERVER_ERROR,
            "Internal server error(email)."
          );
        }
      });
      isUserExist.otp = otp;
      await isUserExist.save();
      // generate user token
      const token = await isUserExist.generateJWTToken("5m");
      if (!token) {
        return ThrowError(
          code.INTERNAL_SERVER_ERROR,
          "Internal server error(create token)."
        );
      }
      return apiResponse(res, code.CREATED, "OTP send successfully.", {
        user: {
          email: isUserExist?.email,
          _id: isUserExist?._id,
          verify: isUserExist?.verify,
        },
        token,
      });
    }
  } else {
    // If user not exist in DB create fully new document
    const mailOptions = {
      from: "test.project7312@gmail.com",
      to: email,
      subject: "Email OTP Verification",
      html: `<p>OTP : <h1>${otp}</h1></p>`,
    };
    await transporter.sendMail(mailOptions, function (err, info) {
      if (err) {
        return ThrowError(
          code.INTERNAL_SERVER_ERROR,
          "Internal server error(email)."
        );
      }
    });
    // createUser
    const createUser = await db?.user.create({
      email: email.toString(),
      otp: otp,
      referredBy: referralId ? referralUser?._id : null,
      referredByone: referralUser?.referredBy || null,
      referredByTwo: referralUser?.referredByone || null,
      referredByThree: referralUser?.referredByTwo || null,
      referredByFour: referralUser?.referredByThree || null,
      referredByFive: referralUser?.referredByFour || null,
      referredBySix: referralUser?.referredByFive || null,
      referredBySeven: referralUser?.referredBySix || null,
      referredByEight: referralUser?.referredBySeven || null,
      referredByNine: referralUser?.referredByEight || null,
      feePercentage: referralUser?.referralFeePercentage,
      referralAddedAt: referralId ? new Date() : null,
    });
    if (!createUser) {
      return ThrowError(
        code.INTERNAL_SERVER_ERROR,
        "Internal server error(create user)."
      );
    }
    const token = await createUser.generateJWTToken("5m");
    if (!token) {
      return ThrowError(
        code.INTERNAL_SERVER_ERROR,
        "Internal server error(create token)."
      );
    }
    return apiResponse(res, code.SUCCESS, "Otp send successfully", {
      user: {
        email: createUser?.email,
        _id: createUser?._id,
        verify: createUser?.verify,
      },
      token,
    });
  }
}

// verify
async function verifySignup(req, res) {
  const user = req?.user;
  const { otp, password, confirmPassword } = req.body;
  // check otp
  if (!otp) {
    return ThrowError(code.BAD_REQUEST, "OTP is required.");
  }
  // compare otp
  if (user?.otp != otp) {
    return ThrowError(code.BAD_REQUEST, "Invalid OTP.");
  }
  // check if user verify
  if (user?.verify) {
    // if verify then just checked otp is right or not which is done on top
    user.otp = null;
    user.lastLogin = new Date();
    await user.save();
    const token = await user?.generateJWTToken("30d");
    if (!token) {
      return ThrowError(code.BAD_REQUEST, "Internal server error(Token).");
    }
    const activeWallet = await user?.walletAddressSOL?.find(
      (item) => item?.primary
    );
    return apiResponse(res, code.SUCCESS, "Login successfully.", {
      user: {
        _id: user?._id,
        email: user?.email,
        walletAddressSOL: activeWallet?.wallet,
        verify: user?.verify,
        referralId: user?.referralId,
        referredBy: user?.referredBy,
      },
      token,
    });
  } else {
    // If not verify then doing complete process like wallet generation, referralId generation, password storing and all
    // check fields
    if (!password || !confirmPassword) {
      return ThrowError(
        code.BAD_REQUEST,
        "Password or confirmPassword required."
      );
    }
    // compare password
    if (password != confirmPassword) {
      return ThrowError(
        code.BAD_REQUEST,
        "Password and confirmPassword does not matched."
      );
    }
    // generate solana wallet
    const [solWallet, evmWallet] = await Promise.allSettled([
      createWalletInTurnKey(user?.email),
      createWalletInTurnKeyEvm(user?.email),
    ]);
    if (!solWallet?.value?.address && !evmWallet?.value?.address) {
      return ThrowError(
        code.INTERNAL_SERVER_ERROR,
        "Internal server error(turnkey wallet generate)."
      );
    }
    const firstWalletSol = {
      wallet: solWallet?.value?.address?.toString(),
      primary: true,
      index: 0,
    };
    // store value to the DB
    user.solTurnkeyId = solWallet?.value?.walletId?.toString();
    user.evmTurnkeyId = evmWallet?.value?.walletId?.toString();
    user.walletAddressEVM = evmWallet?.value?.address?.toString();
    user.verify = true;
    user.lastLogin = new Date();
    user.otp = null;
    user.password = password;
    user.active = true;
    user.walletAddressSOL.push(firstWalletSol);
    user.referralId = `${
      solWallet?.value?.address?.toString().slice(0, 4) +
      solWallet?.value?.address?.toString().slice(-4)
    }`;
    await user.save();
    // generate token
    const token = await user?.generateJWTToken("30d");
    if (!token) {
      return ThrowError(code.BAD_REQUEST, "Internal server error(Token).");
    }
    // send response
    return apiResponse(res, code.SUCCESS, "Signup successfully.", {
      user: {
        _id: user?._id,
        email: user?.email,
        walletAddressSOL: solWallet?.value?.address?.toString(),
        verify: user?.verify,
      },
      token,
    });
  }
}

// login
async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    return ThrowError(code.BAD_REQUEST, "All fields are required.");
  }
  // is user exist
  const user = await db?.user?.findOne({ email });
  if (!user) {
    return ThrowError(code.BAD_REQUEST, "Invalid credential.");
  }
  // check password is correct
  const isPasswordCorrect = await user.isPasswordCorrect(password);
  if (!isPasswordCorrect) {
    return ThrowError(code.BAD_REQUEST, "Invalid password.");
  }
  // generate token
  const token = await user.generateJWTToken("5m");
  if (!token) {
    return ThrowError(code.INTERNAL_SERVER_ERROR, "Internal server error.");
  }
  // generate otp
  const otp = await generateOtp();
  user.otp = otp;
  await user.save();
  // send mail
  const mailOptions = {
    from: "test.project7312@gmail.com",
    to: email,
    subject: "Email OTP Verification",
    html: `<p>OTP : <h1>${otp}</h1></p>`,
  };
  await transporter.sendMail(mailOptions, function (err, info) {
    if (err) {
      return ThrowError(
        code.INTERNAL_SERVER_ERROR,
        "Internal server error(email)."
      );
    }
  });
  return apiResponse(res, code.SUCCESS, "Otp send successfully", {
    user: {
      email: user?.email,
      _id: user?._id,
      verify: user?.verify,
    },
    token,
  });
}

// google login or signup
async function googleLogin(req, res) {
  const { googleCode, inviteCode } = req.body;
  if (!googleCode) {
    return ThrowError(code.BAD_REQUEST, "Google code is required.");
  }
  const userDetail = await googleLoginAuth(googleCode);
  if (!userDetail) {
    return ThrowError(code.BAD_REQUEST, "Unauthorized google login.");
  }
  const isUserExist = await db?.user
    ?.findOne({ email: userDetail?.email })
    .select("-password -updatedAt -otp -verify -walletAddressEVM -active");
  if (isUserExist?.email) {
    // generate user token
    const token = await isUserExist.generateJWTToken("30d");
    if (!token) {
      return ThrowError(
        code.INTERNAL_SERVER_ERROR,
        "Internal server error(create token)."
      );
    }
    isUserExist.lastLogin = new Date();
    const activeWallet = await isUserExist?.walletAddressSOL?.find(
      (item) => item?.primary
    );
    await isUserExist.save();
    return apiResponse(res, code.SUCCESS, "Login successfull", {
      user: {
        _id: isUserExist?._id,
        email: isUserExist?.email,
        walletAddressSOL: activeWallet?.wallet,
        referralId: isUserExist?.referralId,
        referredBy: isUserExist?.referredBy,
        createdAt: isUserExist?.createdAt,
      },
      token,
    });
  } else {
    let referralUser = null;
    if (inviteCode) {
      referralUser = await db?.user?.findOne({ referralId: inviteCode });
      if (!referralUser?.email) {
        return ThrowError(code.BAD_REQUEST, "Invalid invite code.");
      }
    }
    // generate solana wallet
    const [solWallet, evmWallet] = await Promise.allSettled([
      createWalletInTurnKey(userDetail?.email),
      createWalletInTurnKeyEvm(userDetail?.email),
    ]);
    if (!solWallet?.value?.address && !evmWallet?.value?.address) {
      return ThrowError(
        code.INTERNAL_SERVER_ERROR,
        "Internal server error(turnkey wallet generate)."
      );
    }
    // generate referralId
    const referralId = `${
      solWallet?.value?.address?.toString()?.slice(0, 4) +
      solWallet?.value?.address?.toString()?.slice(-4)
    }`;
    // create user
    const createUser = await db?.user.create({
      email: userDetail?.email,
      walletAddressSOL: [
        {
          wallet: solWallet?.value?.address?.toString(),
          primary: true,
          index: 0,
        },
      ],
      solTurnkeyId: solWallet?.value?.walletId?.toString(),
      evmTurnkeyId: evmWallet?.value?.walletId?.toString(),
      walletAddressEVM: evmWallet?.value?.address?.toString(),
      referralId: referralId,
      referredBy: referralUser?._id,
      referredByone: referralUser?.referredBy || null,
      referredByTwo: referralUser?.referredByone || null,
      referredByThree: referralUser?.referredByTwo || null,
      referredByFour: referralUser?.referredByThree || null,
      referredByFive: referralUser?.referredByFour || null,
      referredBySix: referralUser?.referredByFive || null,
      referredBySeven: referralUser?.referredBySix || null,
      referredByEight: referralUser?.referredBySeven || null,
      referredByNine: referralUser?.referredByEight || null,
      feePercentage: referralUser?.referralFeePercentage,
      referralAddedAt: referralUser ? new Date() : null,
      active: true,
      verify: true,
      lastLogin: new Date(),
    });
    // generate token
    const token = await createUser?.generateJWTToken("30d");
    if (!token) {
      return ThrowError(code.BAD_REQUEST, "Internal server error(Token).");
    }
    // send response
    return apiResponse(res, code.SUCCESS, "User login successfully.", {
      user: {
        _id: createUser?._id,
        email: createUser?.email,
        walletAddressSOL: solWallet?.value?.address?.toString(),
        verify: createUser?.verify,
      },
      token,
    });
  }
}

// phantom wallet login or signup
async function phantomLogin(req, res) {
  const { walletAddress, signature, message, inviteCode } = req.body;

  if (!walletAddress) {
    return ThrowError(code.BAD_REQUEST, "Wallet address is required.");
  }

  if (!signature) {
    return ThrowError(code.BAD_REQUEST, "Signature is required.");
  }

  if (!message) {
    return ThrowError(code.BAD_REQUEST, "Message is required.");
  }

  const isValidSignature = await verifyPhantomSignature(
    walletAddress,
    signature,
    message
  );
  if (!isValidSignature) {
    return ThrowError(code.BAD_REQUEST, "Invalid signature.");
  }

  const normalizedWalletAddress = walletAddress.toString().toLowerCase();

  const isUserExist = await db?.user
    ?.findOne({
      phantomAddress: {
        $regex: new RegExp(`^${normalizedWalletAddress}$`, "i"),
      },
    })
    .select("-password -updatedAt -otp -verify -walletAddressEVM -active");

  if (isUserExist?.phantomAddress) {
    // console.log("phantom user exists:", isUserExist?.phantomAddress);
    // ? user exists - login flow
    const token = await isUserExist.generateJWTToken("30d");
    if (!token) {
      return ThrowError(
        code.INTERNAL_SERVER_ERROR,
        "Internal server error(create token)."
      );
    }

    isUserExist.lastLogin = new Date();
    const activeWallet = await isUserExist?.walletAddressSOL?.find(
      (item) => item?.primary
    );
    await isUserExist.save();

    return apiResponse(res, code.SUCCESS, "Login successfull", {
      user: {
        _id: isUserExist?._id,
        email: isUserExist?.email,
        phantomAddress: isUserExist?.phantomAddress,
        walletAddressSOL: activeWallet?.wallet,
        referralId: isUserExist?.referralId,
        referredBy: isUserExist?.referredBy,
        createdAt: isUserExist?.createdAt,
      },
      token,
    });
  } else {
    // ?user doesn't exist - signup flow
    let referralUser = null;
    if (inviteCode) {
      referralUser = await db?.user?.findOne({ referralId: inviteCode });
      if (!referralUser?.email) {
        return ThrowError(code.BAD_REQUEST, "Invalid invite code.");
      }
    }
    const walletEmail = `${normalizedWalletAddress.slice(0, 5)}@phantom.com`;

    const [solWallet, evmWallet] = await Promise.allSettled([
      createWalletInTurnKey(walletEmail),
      createWalletInTurnKeyEvm(walletEmail),
    ]);
    if (!solWallet?.value?.address && !evmWallet?.value?.address) {
      return ThrowError(
        code.INTERNAL_SERVER_ERROR,
        "Internal server error(turnkey wallet generate)."
      );
    }
    const referralId = `${
      solWallet?.value?.address?.toString()?.slice(0, 4) +
      solWallet?.value?.address?.toString()?.slice(-4)
    }`;

    const createUser = await db?.user.create({
      email: walletEmail,
      phantomAddress: normalizedWalletAddress,
      walletAddressSOL: [
        {
          wallet: solWallet?.value?.address?.toString(),
          primary: true,
          index: 0,
        },
      ],
      solTurnkeyId: solWallet?.value?.walletId?.toString(),
      evmTurnkeyId: evmWallet?.value?.walletId?.toString(),
      walletAddressEVM: evmWallet?.value?.address?.toString(),
      referralId: referralId,
      referredBy: referralUser?._id,
      referredByone: referralUser?.referredBy || null,
      referredByTwo: referralUser?.referredByone || null,
      referredByThree: referralUser?.referredByTwo || null,
      referredByFour: referralUser?.referredByThree || null,
      referredByFive: referralUser?.referredByFour || null,
      referredBySix: referralUser?.referredByFive || null,
      referredBySeven: referralUser?.referredBySix || null,
      referredByEight: referralUser?.referredBySeven || null,
      referredByNine: referralUser?.referredByEight || null,
      feePercentage: referralUser?.referralFeePercentage,
      referralAddedAt: referralUser ? new Date() : null,
      active: true,
      verify: true,
      lastLogin: new Date(),
    });
    const token = await createUser?.generateJWTToken("30d");
    if (!token) {
      return ThrowError(code.BAD_REQUEST, "Internal server error(Token).");
    }

    return apiResponse(res, code.SUCCESS, "User registered successfully.", {
      user: {
        _id: createUser?._id,
        email: createUser?.email,
        phantomAddress: createUser?.phantomAddress,
        walletAddressSOL: solWallet?.value?.address?.toString(),
        verify: createUser?.verify,
      },
      token,
    });
  }
}

async function verifyPhantomSignature(walletAddress, signature, message) {
  try {
    const publicKey = new PublicKey(walletAddress);

    const messageBytes = new TextEncoder().encode(message);

    const signatureBytes = new Uint8Array(signature);

    const isValid = nacl.sign.detached.verify(
      messageBytes,
      signatureBytes,
      publicKey.toBytes()
    );

    return isValid;
  } catch (error) {
    console.error("Signature verification error:", error);
    return false;
  }
}

// get private key
async function getSolPhrase(req, res) {
  const user = req.user;
  const pk = await importWalletSeedPhrase(user?.solTurnkeyId);
  if (!pk?.seed) {
    return ThrowError(
      code.INTERNAL_SERVER_ERROR,
      "Internal server error(sol phrase)"
    );
  }
  const encodedPk = await encryptDataForFrontEnd(pk?.seed);
  return await apiResponse(res, code.SUCCESS, "PK", {
    seedPhrases: {
      solana: encodedPk,
    },
  });
}

// get wallet balances
async function getWalletBalances(req, res) {
  const user = req.user;
  const userBalnces = await Promise.all(
    user?.walletAddressSOL?.map((item) =>
      Moralis.SolApi.account
        .getBalance({
          network: "mainnet",
          address: item?.wallet,
        })
        .then((res) => {
          return {
            wallet: item?.wallet,
            primary: item?.primary,
            index: item?.index,
            _id: item?._id,
            balance: Number(res?.raw?.solana || 0),
          };
        })
        .catch((err) => {
          console.log("🚀 ~ getWalletBalances ~ err:", err?.message);
          return {
            wallet: item?.wallet,
            primary: item?.primary,
            index: item?.index,
            _id: item?._id,
            balance: 0,
          };
        })
    )
  );
  return apiResponse(res, code.SUCCESS, "Wallet balances", {
    balances: userBalnces,
  });
}

// generate private key for particuler wallet
async function generatePkSolana(req, res) {
  const user = req.user;
  const { index, wallet } = req.params;
  if (!index || !wallet) {
    return ThrowError(
      code.BAD_REQUEST,
      "Wallet and index is requied address is required."
    );
  }
  if (index > user?.walletAddressSOL?.length - 1) {
    return ThrowError(code.BAD_REQUEST, "Wallet not exist on this index.");
  }
  const pk = await importWalletSeedPhrase(user?.solTurnkeyId);
  if (!pk?.seed) {
    return ThrowError(
      code.INTERNAL_SERVER_ERROR,
      "Internal server error(sol phrase)"
    );
  }

  const getPKSol = await generateSolWalletWithSamePhrase(pk?.seed, index);
  if (getPKSol?.publicKey?.toString() != wallet) {
    return ThrowError(
      code.INTERNAL_SERVER_ERROR,
      "Internal server error(sol PK)"
    );
  }
  if (!getPKSol?.secretKey) {
    return ThrowError(
      code.INTERNAL_SERVER_ERROR,
      "Internal server error(sol PK 2)."
    );
  }
  const convertInStr = convertSolPKInString(getPKSol?.secretKey?.toString());
  if (!convertInStr) {
    return ThrowError(
      code.INTERNAL_SERVER_ERROR,
      "Internal server error(PK str Convert)"
    );
  }
  const encodedPk = await encryptDataForFrontEnd(convertInStr);
  return apiResponse(res, code.SUCCESS, "PK Solana", {
    solanaPk: encodedPk,
  });
}

async function createTokenFavorite(req, res) {
  const {
    symbol,
    img,
    tokenAddress,
    marketCap,
    volume,
    Liqudity,
    pairaddress,
  } = req.body;

  try {
    // Validate input
    if (!symbol || !tokenAddress) {
      return ThrowError(
        code.BAD_REQUEST,
        "Symbol and tokenAddress are required."
      );
    }

    const user = req.user;
    if (!user || !user._id) {
      return ThrowError(code.UNAUTHORIZED, "User not authenticated.");
    }

    const query = `
  query MyQuery($address: String!, $pair_address: String!, $time_1h_ago: DateTime!) {
  Solana {
    DEXTradeByTokens(
      where: {
        Transaction: { Result: { Success: true } }
        Trade: {
          Currency: { MintAddress: { is: $address } }
          Side: { Currency: { MintAddress: { in: ["11111111111111111111111111111111", "So11111111111111111111111111111111111111112"] } } }
          Market: { MarketAddress: { is: $pair_address } }
        }
        Block: { Time: { since: $time_1h_ago } }
      }
    ) {
      buy_volume_1h: sum(
        of: Trade_Side_AmountInUSD
        if: { Trade: { Side: { Type: { is: buy } } }, Block: { Time: { after: $time_1h_ago } } }
      )
      sell_volume_1h: sum(
        of: Trade_Side_AmountInUSD
        if: { Trade: { Side: { Type: { is: sell } } }, Block: { Time: { after: $time_1h_ago } } }
      )
    }
  }
}
`;

    const currentTime = new Date();

    const time1hAgo = new Date(currentTime.getTime() - 3600000);

    const time1hAgoISO = time1hAgo.toISOString().replace(".000Z", "Z");

    const variables = {
      address: tokenAddress,
      pair_address: pairaddress,
      time_1h_ago: time1hAgoISO,
    };

    const response = await axios.post(
      "https://streaming.bitquery.io/eap",
      {
        query,
        variables,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${bqToken}`,
        },
      }
    );
    const solanaData = response.data?.data?.Solana?.DEXTradeByTokens || [];

    const totalVolume = solanaData.reduce((sum, item) => {
      const buyVolume = parseFloat(item.buy_volume_1h) || 0;
      const sellVolume = parseFloat(item.sell_volume_1h) || 0;
      return sum + buyVolume + sellVolume;
    }, 0);

    const formattedTotalVolume = parseFloat(totalVolume.toFixed(2));

    // Create new favorite
    const newFavorite = await db?.tokenFavorite.create({
      symbol,
      img: img || null,
      tokenAddress,
      marketCap,
      volume,
      Liqudity,
      pairaddress,
      tradedVolumeUSD: formattedTotalVolume,
      userId: user._id,
    });

    return apiResponse(res, code.SUCCESS, "Token liked successfully!", {
      newFavorite,
    });
  } catch (error) {
    console.error("Error in createTokenFavorite:", error);
    return ThrowError(code.INTERNAL_SERVER_ERROR, "Something went wrong.");
  }
}

const deleteTokenFavorite = async (req, res) => {
  const { tokenAddress } = req.body;

  if (!tokenAddress) {
    return ThrowError(code.BAD_REQUEST, "Token address is required.");
  }

  const user = req.user;
  if (!user || !user._id) {
    return ThrowError(code.UNAUTHORIZED, "User not authenticated.");
  }

  const existingToken = await db?.tokenFavorite.findOne({
    tokenAddress,
    userId: user._id,
  });

  if (!existingToken) {
    return ThrowError(code.NOT_FOUND, "Token not found in your favorites.");
  }

  await db?.tokenFavorite.deleteOne({
    tokenAddress,
    userId: user._id,
  });

  return apiResponse(res, code.SUCCESS, "Token unliked successfully!", {});
};

const getUserTokenFavorites = async (req, res) => {
  const user = req.user;

  if (!user || !user._id) {
    return ThrowError(code.UNAUTHORIZED, "User not authenticated.");
  }

  const tokenFavorites = await db?.tokenFavorite
    .find({
      userId: user._id,
    })
    .lean();

  if (!tokenFavorites || tokenFavorites.length === 0) {
    return apiResponse(res, code.SUCCESS, "No favorite tokens found.", {
      tokenFavorites: [],
    });
  }

  return apiResponse(
    res,
    code.SUCCESS,
    "Favorite tokens retrieved successfully!",
    {
      tokenFavorites,
    }
  );
};

const checkTokenFavorite = async (req, res) => {
  const { tokenaddress: tokenAddress } = req.params;

  if (!tokenAddress) {
    return ThrowError(code.BAD_REQUEST, "Token address is required.");
  }

  const user = req.user;
  if (!user || !user._id) {
    return ThrowError(code.UNAUTHORIZED, "User not authenticated.");
  }

  const existingToken = await db?.tokenFavorite
    .findOne({
      tokenAddress,
      userId: user._id,
    })
    .lean();

  return apiResponse(res, code.SUCCESS, "Token favorite status checked.", {
    exists: !!existingToken,
  });
};

// check wallet exist or not
const checkWalletExist = async (req, res) => {
  const { address } = req?.params;
  if (!address) {
    return ThrowError(code.BAD_REQUEST, "Wallet address is required.");
  }
  const user = await db?.user?.findOne({
    walletAddressSOL: {
      $elemMatch: {
        wallet: address,
      },
    },
  });
  if (!user) {
    return ThrowError(code.NOT_FOUND, "user not found.");
  }
  return apiResponse(res, code.SUCCESS, "Wallet found.", {
    wallet: true,
  });
};

module.exports = {
  signup,
  verifySignup,
  login,
  googleLogin,
  phantomLogin,
  generatePkSolana,
  getSolPhrase,
  createTokenFavorite,
  deleteTokenFavorite,
  getUserTokenFavorites,
  checkTokenFavorite,
  userDetails,
  getWalletBalances,
  checkWalletExist,
};
