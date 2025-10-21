import React, { useEffect, useMemo, useState, useRef } from "react";
import { GoogleGenAI } from "@google/genai";
import { systemMessage } from "./prompt";
import './App.css'

type DispatchState<T> = React.Dispatch<React.SetStateAction<T>>

type HistoryItemType = {
    from: "model" | "user"
    body: string
}

type HistoryType = HistoryItemType[]

type InputPlaceType = {
    input: string
    setInput: DispatchState<string>
    history: HistoryType
    isLoadingResponse: boolean
    setIsLoadingResponse: DispatchState<boolean>
}

type TextFieldPlaceType = {
    input: string
    setInput: DispatchState<string>
}

type SendMessageButtonType = {
    input: string,
    history: HistoryType
    setInput: DispatchState<string>
    isLoadingResponse: boolean
    setIsLoadingResponse: DispatchState<boolean>
}

type ChatAreaType = {
    history: HistoryType
}

type AIType = {
    apiKey: string
    model: string
}

class AI {
    private apiKey: string
    private model: string
    private response: string
    private ai: GoogleGenAI

    public static models = {
        gemini_2_0_flash: "gemini-2.0-flash",
        gemini_2_5_flash: "gemini-2.5-flash",
        gemini_2_5_pro_light: "gemini-2.5-pro-lite",
    }

    constructor({ apiKey, model }: AIType) {
        this.apiKey = apiKey
        this.model = model
        this.response = "undefined"
        this.ai = new GoogleGenAI({ apiKey: this.apiKey });
    }

    public getResponse(): string {
        return this.response
    }

    private async exec(history: HistoryType): Promise<string> {
        const response = await this.ai.models.generateContent({
            model: this.model,
            contents: history.map((item) => ({
                role: item.from,
                parts: [{ text: item.body }]
            })),
            config: { tools: [{ googleSearch: {} }], }
        })

        return response.text ? response.text : "null"
    }

    public async generateContent(history: HistoryType): Promise<boolean> {
        try {
            this.response = await this.exec(history)
            return true
        } catch (e) {
            return false
        }
    }
}

class History {
    private static history: HistoryType = [{
        from: "user",
        body: systemMessage
    }]

    private static setHistory: DispatchState<HistoryType>

    public static setHistoryDispatchState(setHistory: DispatchState<HistoryType>): void {
        this.setHistory = setHistory
        this.setHistory([{
            from: "user",
            body: systemMessage
        }])
    }

    public static getHistory(): HistoryType {
        return this.history
    }

    public static crearHistory(): void {
        this.history = []
        this.setHistory([])
    }

    public static addToHistory(item: HistoryItemType): void {
        this.history.push(item)
        this.setHistory(prev => prev.concat(item))
    }
}

const InputPlace = (
    { input, setInput, history, isLoadingResponse, setIsLoadingResponse }: InputPlaceType
): React.ReactElement => {
    return (
        <div className="inputs-container">
            <TextFieldPlace input={input} setInput={setInput} />
            <SendMessageButton
                input={input}
                history={history}
                setInput={setInput}
                isLoadingResponse={isLoadingResponse}
                setIsLoadingResponse={setIsLoadingResponse}
            />
        </div>
    )
}

const TextFieldPlace = ({ input, setInput }: TextFieldPlaceType): React.ReactElement => {
    const handleChange = (event: any) => {
        setInput(event.target.value);
    };

    return (
        <input
            className="text-input"
            type="text"
            value={input}
            onChange={handleChange}
            placeholder="type..."
        />
    );
}

const SendMessageButton = (
    { input, history, setInput, isLoadingResponse, setIsLoadingResponse }: SendMessageButtonType
): React.ReactElement => {

    async function handleSendMessage(input: string): Promise<boolean> {
        if (!input.trim()) return false;
        setInput("");

        setIsLoadingResponse(true);

        History.addToHistory({ from: "user", body: input });

        const ai = new AI({
            apiKey: "AIzaSyAxFe05IBGAs-c6Viuiux3v_Imhyhkpyro",
            model: AI.models.gemini_2_0_flash
        });

        await ai.generateContent(History.getHistory());

        History.addToHistory({ from: "model", body: ai.getResponse() });
        setIsLoadingResponse(false);

        return true;
    }

    useEffect(() => {
        const handleEnter = (e: KeyboardEvent) => {
            if (e.key === "Enter") {
                e.preventDefault();
                handleSendMessage(input);
            }
        };

        window.addEventListener("keydown", handleEnter);
        return () => window.removeEventListener("keydown", handleEnter);
    }, [input, history]);

    return (
        <button onClick={() => handleSendMessage(input)} disabled={isLoadingResponse}>
            <img
                style={{ filter: "brightness(0) invert(0.8)" }}
                color="white"
                width="24"
                height="24"
                alt="sent"
                src="https://img.icons8.com/material-rounded/24/sent.png"
            />
        </button>
    );
};

const ChatArea = ({ history }: ChatAreaType): React.ReactElement => {
    const chatEndRef = useRef<HTMLDivElement>(null);

    const mapHistory = useMemo(() => (
        history.slice(1).map((msg, i) => (
            <div className={msg.from === "model" ? "ai-message" : "user-message"} key={i + 1}>
                {msg.from === "user" ? msg.body : (msg.body.match(/\⸘(.*?)⸘/)?.[1] || msg.body)}
            </div>
        ))
    ), [history]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [history]); // history değiştiğinde scroll en alta gidecek

    return (
        <div className="chat-area">
            {mapHistory.length === 0 ? (
                <div className="title">
                    <h1 className="ai-name">Karbo</h1>
                    <h3 className="developer-name">M. Radwan Assil</h3>
                </div>
            ) : (
                <>
                    {mapHistory}
                    <div ref={chatEndRef} />
                </>
            )}
        </div>
    );
};

const HomePage = (): React.ReactElement => {
    const [input, setInput] = useState<string>("")
    const [history, setHistory] = useState<HistoryType>([])
    const [isLoadingResponse, setIsLoadingResponse] = useState<boolean>(false)

    useEffect(() => {
        History.setHistoryDispatchState(setHistory)
    }, [])

    return (
        <div className="home-page">
            <ChatArea history={history} />
            <InputPlace
                input={input}
                setInput={setInput}
                history={history}
                isLoadingResponse={isLoadingResponse}
                setIsLoadingResponse={setIsLoadingResponse}
            />
        </div>
    )
}

declare global {
    interface Window {
        adsbygoogle: any[];
    }
}

class AdComponent extends React.Component {
    private alreadyPushed = false;

    componentDidMount() {
        if (!this.alreadyPushed) {
            try {
                (window.adsbygoogle = window.adsbygoogle || []).push({});
                this.alreadyPushed = true;
            } catch (e) {
                console.error("AdSense error:", e);
            }
        }
    }

    render() {
        return (
            <ins
                className="adsbygoogle"
                style={{ display: "block", width: "100%", minWidth: "300px", height: "250px" }}
                data-ad-client="ca-pub-8571387127540101"
                data-ad-slot="1722128478"
                data-ad-format="auto"
                data-full-width-responsive="true"
            />
        );
    }
}

const App = (): React.ReactElement => {
    return (
        <div className="root">
            <HomePage />
        </div>
    )
}

export default App