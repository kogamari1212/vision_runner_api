// 1. 必要なモジュールを読み込む
const { PrismaClient } = require("@prisma/client");
const express = require("express");
const cors = require("cors");

const app = express();
// パスワードハッシュ化
const bcrypt = require("bcrypt");

// json web token jwtの機能を設定します🤗
const jwt = require("jsonwebtoken");

// 環境変数=秘密の鍵が使えるようにdotenvを記述して使えるようにします🤗
require("dotenv");
const prisma = new PrismaClient();


// 2. ポート番号を設定
//const PORT = 8888;

// 3. ミドルウェア設定
app.use(cors({
  origin: "https://vision-runner.vercel.app", // ✅ フロントのドメイン
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true, // cookie使わないなら false でもOK
}));

app.use(express.json());

// 4. ルートエンドポイント（テスト用）
app.get("/", (req, res) => {
  res.send("<h1>Vision Runner API サーバー稼働中！</h1>");
});

// 5. 投稿取得API（もともとある想定）
app.get("/api/posts", async (req, res) => {
  try {
    const posts = await prisma.post.findMany({
      include: {
        author: true, // 投稿に紐づくユーザーも取得
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    res.json(posts);
  } catch (error) {
    console.error("投稿の取得に失敗しました:", error);
    res.status(500).json({ error: "投稿の取得に失敗しました" });
  }
});

// ★6. 未来投稿を受け取る新しいAPIを追加！！
app.post("/api/future", async (req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ error: "contentが必須です" });
    }

    const futurePost = await prisma.future.create({
      data: {
        content,
      },
    });

    res.status(201).json(futurePost);
  } catch (error) {
    console.error("未来投稿の作成に失敗しました:", error);
    res.status(500).json({ error: "未来投稿の作成に失敗しました" });
  }
});

// 未来投稿 更新APIを追加
app.put("/api/future/:id", async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;

  if (!content) {
    return res.status(400).json({ error: "更新内容が空です" });
  }

  try {
    const updatedFuture = await prisma.future.update({
      where: { id: Number(id) },
      data: { content },
    });
    res.json(updatedFuture);
  } catch (error) {
    console.error("未来投稿の更新に失敗しました:", error);
    res.status(500).json({ error: "未来投稿の更新に失敗しました" });
  }
});

// 未来投稿 削除APIを追加
app.delete("/api/future/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.future.delete({
      where: { id: Number(id) },
    });
    res.json({ message: "未来投稿を削除しました" });
  } catch (error) {
    console.error("未来投稿の削除に失敗しました:", error);
    res.status(500).json({ error: "未来投稿の削除に失敗しました" });
  }
});

// 未来投稿の一覧取得API
app.get("/api/futures", async (req, res) => {
  try {
    const futures = await prisma.future.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });
    res.json(futures);
  } catch (error) {
    console.error("未来投稿の取得に失敗しました:", error);
    res.status(500).json({ error: "未来投稿の取得に失敗しました" });
  }
});

// ユーザー登録API
app.post("/api/auth/register", async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: "全ての項目を入力してください" });
  }

  try {
    // パスワードをハッシュ化
    const hashedPassword = await bcrypt.hash(password, 10);

    // 新規ユーザー作成
    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
      },
    });

    res.status(201).json({ message: "ユーザー登録成功", user: newUser });
  } catch (error) {
    console.error("ユーザー登録失敗:", error);
    res.status(500).json({ error: "登録に失敗しました" });
  }
});

// ログインAPI
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "全ての項目を入力してください" });
  }

  try {
    // ① メールアドレスでユーザー検索
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ error: "メールアドレスが正しくありません" });
    }

    // ② パスワードを比較する
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: "パスワードが正しくありません" });
    }

    // ③ ログイン成功なら（ここでは仮でJWTトークンも作れる）
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || "defaultsecret", // ※環境変数にjwt secretを設定するのが本当は望ましい
      { expiresIn: "1h" }
    );

    res.json({ message: "ログイン成功", token, user });
  } catch (error) {
    console.error("ログイン失敗:", error);
    res.status(500).json({ error: "ログインに失敗しました" });
  }
});



// 未来ビジョンの新規投稿API（Postモデル用）
app.post("/api/post", async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ error: "contentが必須です" });
    }

    // 仮でauthorId=1 を付与して保存する（ログイン管理がまだなら）
    const newPost = await prisma.post.create({
      data: {
        content,
        authorId: 1, // 仮設定：適切にログインユーザーIDを紐づけるなら後で修正
      },
    });

    res.status(201).json(newPost);
  } catch (error) {
    console.error("ビジョン投稿作成エラー:", error);
    res.status(500).json({ error: "ビジョン投稿の作成に失敗しました" });
  }
});

// 未来ビジョン 更新APIを追加
app.put("/api/post/:id", async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;

  if (!content) {
    return res.status(400).json({ error: "更新内容が空です" });
  }

  try {
    const updatedPost = await prisma.post.update({
      where: { id: Number(id) },
      data: { content },
    });
    res.json(updatedPost);
  } catch (error) {
    console.error("ビジョン投稿の更新に失敗しました:", error);
    res.status(500).json({ error: "ビジョン投稿の更新に失敗しました" });
  }
});

// 未来ビジョン 削除APIを追加
app.delete("/api/post/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.post.delete({
      where: { id: Number(id) },
    });
    res.json({ message: "ビジョン投稿を削除しました" });
  } catch (error) {
    console.error("ビジョン投稿の削除に失敗しました:", error);
    res.status(500).json({ error: "ビジョン投稿の削除に失敗しました" });
  }
});





// 7. サーバー起動
const PORT = process.env.PORT || 8888; // ★ここを絶対こうする
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});

