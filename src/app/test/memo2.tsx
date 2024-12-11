'use client';

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronUp } from "lucide-react"; // アイコンをインポート

const TeacherSearch = () => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    // ダミーデータ
    const teachers = ["田中先生", "山田先生", "鈴木先生", "佐藤先生"];

    // 検索結果フィルタリング
    const filteredTeachers = teachers.filter((teacher) =>
        teacher.includes(searchTerm)
    );

    return (
        <Card className="max-w-sm mx-auto shadow">
            <CardHeader className="flex justify-between items-center">
                <CardTitle className="flex items-center space-x-2 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                    <span>空いている先生</span>
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </CardTitle>
            </CardHeader>
            {isExpanded && (
                <CardContent>
                    <Input
                        placeholder="先生の名前を検索"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="mb-4"
                    />
                    <ul>
                        {filteredTeachers.length > 0 ? (
                            filteredTeachers.map((teacher, index) => (
                                <li key={index}>{teacher}</li>
                            ))
                        ) : (
                            <li>該当する先生が見つかりません</li>
                        )}
                    </ul>
                </CardContent>
            )}
        </Card>
    );
};

export default TeacherSearch;
