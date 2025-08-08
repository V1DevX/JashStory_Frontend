import React from "react";

const PostFilters = ({ filter, setFilter }) => {
  return (
    <div style={{ marginBottom: "1rem" }}>
      <input
        type="text"
        placeholder="Search..."
        value={filter.search}
        onChange={(e) => setFilter({ ...filter, search: e.target.value })}
      />
      <select
        value={filter.category}
        onChange={(e) => setFilter({ ...filter, category: e.target.value })}
      >
        <option value="">All Categories</option>
        <option value="news">News</option>
        <option value="tutorial">Tutorial</option>
      </select>
    </div>
  );
};

export default PostFilters;
