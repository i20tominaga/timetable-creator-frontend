import React, { useState } from "react";
import axios from "axios";

const SetRoomManual = () => {
    const [roomName, setRoomName] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [reason, setReason] = useState("");
    const [setBy, /*setSetBy*/] = useState("current_user"); // ログインユーザー名を想定

    const handleSubmit = async () => {
        try {
            // 入力された日時を UNIX 時間に変換
            const start = Math.floor(new Date(startDate).getTime() / 1000);
            const end = Math.floor(new Date(endDate).getTime() / 1000);

            if (start >= end) {
                alert("開始時刻は終了時刻より前でなければなりません。");
                return;
            }

            // データをバックエンドに送信
            const response = await axios.post(`http://localhost:3001/api/rooms/set-manual/${roomName}`, {
                isManual: true,
                reason,
                setBy,
                start,
                end,
            });

            alert(response.data.message);
        } catch (error) {
            console.error("エラーが発生しました:", error);
            alert("手動設定の更新に失敗しました。");
        }
    };

    return (
        <div>
            <h1>教室の手動設定</h1>
            <form onSubmit={(e) => e.preventDefault()}>
                <div>
                    <label>
                        教室名:
                        <input
                            type="text"
                            value={roomName}
                            onChange={(e) => setRoomName(e.target.value)}
                            required
                        />
                    </label>
                </div>
                <div>
                    <label>
                        開始日時:
                        <input
                            type="datetime-local"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            required
                        />
                    </label>
                </div>
                <div>
                    <label>
                        終了日時:
                        <input
                            type="datetime-local"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            required
                        />
                    </label>
                </div>
                <div>
                    <label>
                        理由:
                        <input
                            type="text"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            required
                        />
                    </label>
                </div>
                <button type="button" onClick={handleSubmit}>
                    送信
                </button>
            </form>
        </div>
    );
};

export default SetRoomManual;
