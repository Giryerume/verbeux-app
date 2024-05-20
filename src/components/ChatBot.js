import React, { useState } from "react";
import "@chatscope/chat-ui-kit-styles/dist/default/styles.min.css";
import {
  MainContainer,
  ChatContainer,
  MessageList,
  Message,
  MessageInput,
  TypingIndicator,
} from "@chatscope/chat-ui-kit-react";
import "./ChatBot.css";

const ChatBot = () => {
  const [sessionId, setSessionId] = useState(null);
  const [typing, setTyping] = useState(false);
  const [messages, setMessages] = useState([]);

  const createSession = async () => {
    if (!sessionId) {
      try {
        const response = await fetch("api/session/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });
        const data = await response.json();
        console.log(data.id);
        if (data.id) {
          setSessionId(data.id);
          setMessages([
            {
              message: "Olá! Como posso ajudar você hoje?",
              sender: "Assistant",
              direction: "incoming",
            },
          ]);
        }
      } catch (error) {
        console.error("Erro ao criar sessão:", error);
      }
    }
  };

  const openChatBot = () => {
    document.body.classList.toggle("show-chatbot");
    createSession();
  };

  const closeChatBot = () => {
    document.body.classList.remove("show-chatbot");
  };

  const sendMessage = async (message) => {
    const newMessage = {
      message: message,
      sender: "User",
      direction: "outgoing",
    };

    const newMessages = [...messages, newMessage];

    setMessages(newMessages);

    setTyping(true);

    await fetch(`api/session/${sessionId}/`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: message,
      }),
    })
      .then((data) => {
        return data.json();
      })
      .then(async (data) => {
        if (data.response[0].type === "text") {
          setMessages([
            ...newMessages,
            {
              message: data.response[0].data,
              sender: "Assistant",
              direction: "incoming",
            },
          ]);
        } else {
          setMessages([
            ...newMessages,
            {
              message: await handleTrigger(data.response[0].data),
              sender: "Assistant",
              direction: "incoming",
            },
          ]);
        }
        setTyping(false);
      });
  };

  async function handleTrigger(triggerData) {
    const function_name = triggerData.function_name;
    const args = triggerData.args;
    if (function_name === "deixar_reclamacao") {
      await sendComplaint(args);
      return `Ficamos tristes em ouvir isso, ${args.nome_cliente}. Sua reclamação será enviada para nosso time! `;
    } else if (function_name === "deixar_elogio") {
      await sendPraise(args);
      return `Ficamos felizes em ouvir isso, ${args.nome_cliente}. Seu elogio será enviado para nosso time! `;
    } else {
      await sendSugestion(args);
      return `Ficamos animados em ouvir isso, ${args.nome_cliente}. Sua sugestão será enviada para nosso time! `;
    }
  }

  const sendComplaint = async (args) => {
    await fetch("api/feedbacks/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: 1,
        content: args.reclamacao,
        client_name: args.nome_cliente,
      }),
    });
  };

  const sendPraise = async (args) => {
    await fetch("api/feedbacks/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: 1,
        content: args.elogio,
        client_name: args.nome_cliente,
      }),
    });
  };

  const sendSugestion = async (args) => {
    await fetch("api/feedbacks/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: 3,
        content: args.sugestao,
        client_name: args.nome_cliente,
      }),
    });
  };

  return (
    <div>
      <button className="chatbot-toggler" onClick={openChatBot}>
        <span className="material-symbols-rounded">mode_comment</span>
        <span className="material-symbols-outlined">close</span>
      </button>
      <div className="chatbot">
        <header>
          <h2>Fale com o assistente</h2>
          <span
            className="close-btn material-symbols-outlined"
            onClick={closeChatBot}
          >
            close
          </span>
        </header>
        <MainContainer style={{ position: "relative", height: "500px" }}>
          <ChatContainer>
            <MessageList
              typingIndicator={
                typing ? (
                  <TypingIndicator content="O assistente está digitando" />
                ) : null
              }
            >
              {messages.map((message, i) => {
                return <Message key={i} model={message} />;
              })}
            </MessageList>
            <MessageInput
              placeholder="Digite aqui..."
              onSend={sendMessage}
              attachButton={false}
            />
          </ChatContainer>
        </MainContainer>
      </div>
    </div>
  );
};

export default ChatBot;
