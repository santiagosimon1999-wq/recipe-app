type SearchBarProps = {
  searchTerm: string;
  onSearchChange: (value: string) => void;
};

function SearchBar({ searchTerm, onSearchChange }: SearchBarProps) {
  return (
    <div className="search-bar">
      <label className="search-bar__label" htmlFor="recipe-search">
        Search recipes
      </label>
      <input
        id="recipe-search"
        className="search-bar__input"
        type="text"
        placeholder="Search by title..."
        value={searchTerm}
        onChange={(event) => onSearchChange(event.target.value)}
      />
    </div>
  );
}

export default SearchBar;

