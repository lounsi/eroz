import { createContext, useContext, useState } from 'react';

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
    const [isChatVisible, setIsChatVisible] = useState(true);
    const [isChatOpen, setIsChatOpen] = useState(false);

    const toggleChat = () => setIsChatOpen(prev => !prev);
    const setChatVisibility = (visible) => setIsChatVisible(visible);

    return (
        <ChatContext.Provider value={{ isChatVisible, isChatOpen, toggleChat, setChatVisibility, setIsChatOpen }}>
            {children}
        </ChatContext.Provider>
    );
};

export const useChat = () => useContext(ChatContext);
