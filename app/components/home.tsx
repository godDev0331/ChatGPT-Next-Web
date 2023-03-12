"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import "katex/dist/katex.min.css";
import RemarkMath from "remark-math";
import RehypeKatex from "rehype-katex";

import EmojiPicker, { Emoji, Theme as EmojiTheme } from "emoji-picker-react";

import { IconButton } from "./button";
import styles from "./home.module.scss";

import SettingsIcon from "../icons/settings.svg";
import GithubIcon from "../icons/github.svg";
import ChatGptIcon from "../icons/chatgpt.svg";
import SendWhiteIcon from "../icons/send-white.svg";
import BrainIcon from "../icons/brain.svg";
import ExportIcon from "../icons/export.svg";
import BotIcon from "../icons/bot.svg";
import AddIcon from "../icons/add.svg";
import DeleteIcon from "../icons/delete.svg";
import LoadingIcon from "../icons/three-dots.svg";
import ResetIcon from "../icons/reload.svg";

import { Message, SubmitKey, useChatStore, Theme } from "../store";
import { Card, List, ListItem, Popover } from "./ui-lib";

export function Markdown(props: { content: string }) {
  return (
    <ReactMarkdown remarkPlugins={[RemarkMath]} rehypePlugins={[RehypeKatex]}>
      {props.content}
    </ReactMarkdown>
  );
}

export function Avatar(props: { role: Message["role"] }) {
  const config = useChatStore((state) => state.config);

  if (props.role === "assistant") {
    return <BotIcon className={styles["user-avtar"]} />;
  }

  return (
    <div className={styles["user-avtar"]}>
      <Emoji unified={config.avatar} size={18} />
    </div>
  );
}

export function ChatItem(props: {
  onClick?: () => void;
  onDelete?: () => void;
  title: string;
  count: number;
  time: string;
  selected: boolean;
}) {
  return (
    <div
      className={`${styles["chat-item"]} ${
        props.selected && styles["chat-item-selected"]
      }`}
      onClick={props.onClick}
    >
      <div className={styles["chat-item-title"]}>{props.title}</div>
      <div className={styles["chat-item-info"]}>
        <div className={styles["chat-item-count"]}>{props.count} 条对话</div>
        <div className={styles["chat-item-date"]}>{props.time}</div>
      </div>
      <div className={styles["chat-item-delete"]} onClick={props.onDelete}>
        <DeleteIcon />
      </div>
    </div>
  );
}

export function ChatList() {
  const [sessions, selectedIndex, selectSession, removeSession] = useChatStore(
    (state) => [
      state.sessions,
      state.currentSessionIndex,
      state.selectSession,
      state.removeSession,
    ]
  );

  return (
    <div className={styles["chat-list"]}>
      {sessions.map((item, i) => (
        <ChatItem
          title={item.topic}
          time={item.lastUpdate}
          count={item.messages.length}
          key={i}
          selected={i === selectedIndex}
          onClick={() => selectSession(i)}
          onDelete={() => removeSession(i)}
        />
      ))}
    </div>
  );
}

function useSubmitHandler() {
  const config = useChatStore((state) => state.config);
  const submitKey = config.submitKey;

  const shouldSubmit = (e: KeyboardEvent) => {
    if (e.key !== "Enter") return false;

    return (
      (config.submitKey === SubmitKey.AltEnter && e.altKey) ||
      (config.submitKey === SubmitKey.CtrlEnter && e.ctrlKey) ||
      (config.submitKey === SubmitKey.ShiftEnter && e.shiftKey) ||
      config.submitKey === SubmitKey.Enter
    );
  };

  return {
    submitKey,
    shouldSubmit,
  };
}

export function Chat() {
  type RenderMessage = Message & { preview?: boolean };

  const session = useChatStore((state) => state.currentSession());
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { submitKey, shouldSubmit } = useSubmitHandler();

  const onUserInput = useChatStore((state) => state.onUserInput);
  const onUserSubmit = () => {
    if (userInput.length <= 0) return;
    setIsLoading(true);
    onUserInput(userInput).then(() => setIsLoading(false));
    setUserInput("");
  };
  const onInputKeyDown = (e: KeyboardEvent) => {
    if (shouldSubmit(e)) {
      onUserSubmit();
      e.preventDefault();
    }
  };
  const latestMessageRef = useRef<HTMLDivElement>(null);

  const messages = (session.messages as RenderMessage[])
    .concat(
      isLoading
        ? [
            {
              role: "assistant",
              content: "……",
              date: new Date().toLocaleString(),
              preview: true,
            },
          ]
        : []
    )
    .concat(
      userInput.length > 0
        ? [
            {
              role: "user",
              content: userInput,
              date: new Date().toLocaleString(),
              preview: true,
            },
          ]
        : []
    );

  useEffect(() => {
    latestMessageRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  });

  return (
    <div className={styles.chat} key={session.id}>
      <div className={styles["window-header"]}>
        <div>
          <div className={styles["window-header-title"]}>{session.topic}</div>
          <div className={styles["window-header-sub-title"]}>
            与 ChatGPT 的 {session.messages.length} 条对话
          </div>
        </div>
        <div className={styles["window-actions"]}>
          <div className={styles["window-action-button"]}>
            <IconButton
              icon={<BrainIcon />}
              bordered
              title="查看压缩后的历史 Prompt（开发中）"
            />
          </div>
          <div className={styles["window-action-button"]}>
            <IconButton
              icon={<ExportIcon />}
              bordered
              title="导出聊天记录为 Markdown（开发中）"
            />
          </div>
        </div>
      </div>

      <div className={styles["chat-body"]}>
        {messages.map((message, i) => {
          const isUser = message.role === "user";

          return (
            <div
              key={i}
              className={
                isUser ? styles["chat-message-user"] : styles["chat-message"]
              }
            >
              <div className={styles["chat-message-container"]}>
                <div className={styles["chat-message-avatar"]}>
                  <Avatar role={message.role} />
                </div>
                {(message.preview || message.streaming) && (
                  <div className={styles["chat-message-status"]}>正在输入…</div>
                )}
                <div className={styles["chat-message-item"]}>
                  {(message.preview || message.content.length === 0) &&
                  !isUser ? (
                    <LoadingIcon />
                  ) : (
                    <div className="markdown-body">
                      <Markdown content={message.content} />
                    </div>
                  )}
                </div>
                {!isUser && !message.preview && (
                  <div className={styles["chat-message-actions"]}>
                    <div className={styles["chat-message-action-date"]}>
                      {message.date.toLocaleString()}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <span ref={latestMessageRef} style={{ opacity: 0 }}>
          -
        </span>
      </div>

      <div className={styles["chat-input-panel"]}>
        <div className={styles["chat-input-panel-inner"]}>
          <textarea
            className={styles["chat-input"]}
            placeholder={`输入消息，${submitKey} 发送`}
            rows={3}
            onInput={(e) => setUserInput(e.currentTarget.value)}
            value={userInput}
            onKeyDown={(e) => onInputKeyDown(e as any)}
          />
          <IconButton
            icon={<SendWhiteIcon />}
            text={"发送"}
            className={styles["chat-input-send"] + " no-dark"}
            onClick={onUserSubmit}
          />
        </div>
      </div>
    </div>
  );
}

function useSwitchTheme() {
  const config = useChatStore((state) => state.config);

  useEffect(() => {
    document.body.classList.remove("light");
    document.body.classList.remove("dark");
    if (config.theme === "dark") {
      document.body.classList.add("dark");
    } else if (config.theme === "light") {
      document.body.classList.add("light");
    }
  }, [config.theme]);
}

export function Home() {
  const [createNewSession] = useChatStore((state) => [state.newSession]);

  // settings
  const [openSettings, setOpenSettings] = useState(false);

  useSwitchTheme();

  return (
    <div className={styles.container}>
      <div className={styles.sidebar}>
        <div className={styles["sidebar-header"]}>
          <div className={styles["sidebar-title"]}>ChatGPT Next</div>
          <div className={styles["sidebar-sub-title"]}>
            Build your own AI assistant.
          </div>
          <div className={styles["sidebar-logo"]}>
            <ChatGptIcon />
          </div>
        </div>

        <div
          className={styles["sidebar-body"]}
          onClick={() => setOpenSettings(false)}
        >
          <ChatList />
        </div>

        <div className={styles["sidebar-tail"]}>
          <div className={styles["sidebar-actions"]}>
            <div className={styles["sidebar-action"]}>
              <IconButton
                icon={<SettingsIcon />}
                onClick={() => setOpenSettings(!openSettings)}
              />
            </div>
            <div className={styles["sidebar-action"]}>
              <a href="https://github.com/Yidadaa" target="_blank">
                <IconButton icon={<GithubIcon />} />
              </a>
            </div>
          </div>
          <div>
            <IconButton
              icon={<AddIcon />}
              text={"新的聊天"}
              onClick={createNewSession}
            />
          </div>
        </div>
      </div>

      <div className={styles["window-content"]}>
        {openSettings ? <Settings /> : <Chat key="chat" />}
      </div>
    </div>
  );
}

export function Settings() {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [config, updateConfig] = useChatStore((state) => [
    state.config,
    state.updateConfig,
  ]);

  return (
    <>
      <div className={styles["window-header"]}>
        <div>
          <div className={styles["window-header-title"]}>设置</div>
          <div className={styles["window-header-sub-title"]}>设置选项</div>
        </div>
        <div className={styles["window-actions"]}>
          <div className={styles["window-action-button"]}>
            <IconButton icon={<ResetIcon />} bordered title="重置所有选项" />
          </div>
        </div>
      </div>
      <div className={styles["settings"]}>
        <List>
          <ListItem>
            <div className={styles["settings-title"]}>头像</div>
            <Popover
              onClose={() => setShowEmojiPicker(false)}
              content={
                <EmojiPicker
                  lazyLoadEmojis
                  theme={EmojiTheme.AUTO}
                  onEmojiClick={(e) => {
                    updateConfig((config) => (config.avatar = e.unified));
                    setShowEmojiPicker(false);
                  }}
                />
              }
              open={showEmojiPicker}
            >
              <div
                className={styles.avatar}
                onClick={() => setShowEmojiPicker(true)}
              >
                <Avatar role="user" />
              </div>
            </Popover>
          </ListItem>

          <ListItem>
            <div className={styles["settings-title"]}>发送键</div>
            <div className="">
              <select
                value={config.submitKey}
                onChange={(e) => {
                  updateConfig(
                    (config) =>
                      (config.submitKey = e.target.value as any as SubmitKey)
                  );
                }}
              >
                {Object.values(SubmitKey).map((v) => (
                  <option value={v} key={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
          </ListItem>

          <ListItem>
            <div className={styles["settings-title"]}>主题</div>
            <div className="">
              <select
                value={config.theme}
                onChange={(e) => {
                  updateConfig(
                    (config) => (config.theme = e.target.value as any as Theme)
                  );
                }}
              >
                {Object.values(Theme).map((v) => (
                  <option value={v} key={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
          </ListItem>
        </List>
        <List>
          <ListItem>
            <div className={styles["settings-title"]}>最大上下文消息数</div>
            <input
              type="range"
              title={config.historyMessageCount.toString()}
              value={config.historyMessageCount}
              min="5"
              max="20"
              step="5"
              onChange={(e) =>
                updateConfig(
                  (config) =>
                    (config.historyMessageCount = e.target.valueAsNumber)
                )
              }
            ></input>
          </ListItem>

          <ListItem>
            <div className={styles["settings-title"]}>
              上下文中包含机器人消息
            </div>
            <input
              type="checkbox"
              checked={config.sendBotMessages}
              onChange={(e) =>
                updateConfig(
                  (config) => (config.sendBotMessages = e.currentTarget.checked)
                )
              }
            ></input>
          </ListItem>
        </List>
      </div>
    </>
  );
}
