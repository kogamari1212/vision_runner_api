// 1. 必要なモジュールを読み込む
const { PrismaClient } = require("@prisma/client");
const express = require("express");
const cors = require("cors");

const app = express();
const prisma = new PrismaClient();

// 2. ポート番号を設定
const PORT = 8888;

// 3. ミドルウェア設定
app.use(cors());
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
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
