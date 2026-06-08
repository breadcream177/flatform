interface SearchPaginationProps {
  page: number;
  pageNumbers: number[];
  onPageChange: (page: number) => void;
}

function SearchPagination({ page, pageNumbers, onPageChange }: SearchPaginationProps) {
  return (
    <div className="search-pagination">
      <button
        className="pagination-arrow"
        disabled={page === 1}
        onClick={() => onPageChange(page - 1)}
      >
        ‹
      </button>

      {pageNumbers.map((pageNumber) => (
        <button
          key={pageNumber}
          className={page === pageNumber ? 'pagination-number active' : 'pagination-number'}
          onClick={() => onPageChange(pageNumber)}
        >
          {pageNumber}
        </button>
      ))}

      <button
        className="pagination-arrow"
        disabled={page === 10}
        onClick={() => onPageChange(page + 1)}
      >
        ›
      </button>
    </div>
  );
}

export default SearchPagination;

