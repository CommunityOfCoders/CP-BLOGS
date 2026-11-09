"use client";
import React from "react";
import MainLayout from "./MainLayout";
import ProfileSidebar from "./ProfileSidebar";

function Profile({ data }) {
  return (
    <div className="px-8 py-12 flex gap-4 bg-background min-h-screen">
      <div className="w-[400px] p-4">
        <ProfileSidebar data={data}/>
      </div>
      <div className="w-full p-4">
        <MainLayout data={data}/>
      </div>
    </div>
  );
}

export default Profile;
