import React, { useState, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, Platform } from 'react-native';
import { Search, X } from 'lucide-react-native';

export default function SearchReport({ setDebouncedQuery, setCurrentPage }) {
  const [searchText, setSearchText] = useState('');
  const [debouncedValue, setDebouncedValue] = useState('');

  // 🔹 Debounce: update debouncedValue only after delay
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(searchText);
    }, 800); // adjust delay as needed

    return () => clearTimeout(handler);
  }, [searchText]);

  // 🔹 Trigger parent search only when debounced value changes
  useEffect(() => {
    if (debouncedValue.trim()) {
      setDebouncedQuery(debouncedValue);
      setCurrentPage(1); // ✅ reset page
    } else {
      setDebouncedQuery("");
      setCurrentPage(1);
    }
  }, [debouncedValue]);


  const handleClear = () => {
    setSearchText('');
    setDebouncedQuery('');
  };
  const handleSearch = (text) => {
    setSearchText(text);
  };


  return (
    // <View className="w-full bg-white">
    <View className="flex-row items-center border-2 border-[#00000080] rounded-lg px-3 py-0 min-h-[30px]">
      <Search color="#6C757D" size={19} className="mr-2" />

      <TextInput
        className="flex-1 text-base text-gray-900 leading-5"
        placeholder="Search.."
        placeholderTextColor="#6C757D"
        value={searchText}
        onChangeText={handleSearch}
        returnKeyType="search"
        style={Platform.OS === "web" ? { outlineStyle: "none" } : {}}
      />

      {searchText ? (
        <TouchableOpacity onPress={handleClear} className="ml-2">
          <X color="#6C757D" size={19} />
        </TouchableOpacity>
      ) : null}
    </View>
    // </View>

  );
}
