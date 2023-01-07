import * as React from 'react';
import { debounce } from '@mui/material/utils';
import { DataGridPro, useGridApiRef } from '@mui/x-data-grid-pro';
import { createFakeServer, loadServerRows } from '@mui/x-data-grid-generator';

const DATASET_OPTION = {
  dataSet: 'Employee',
  rowLength: 10000,
};

const { columns, columnsWithDefaultColDef, useQuery } =
  createFakeServer(DATASET_OPTION);

const emptyObject = {};

export default function LazyLoadingGrid() {

  const { data: dataServerSide } = useQuery(emptyObject);

  const apiRef = useGridApiRef();
  const [initialRows, setInitialRows] = React.useState([]);
  const [rowCount, setRowCount] = React.useState(0);

  const fetchRow = React.useCallback(
    async (params) => {
      const serverRows = await loadServerRows(
        dataServerSide,
        {
          filterModel: params.filterModel,
          sortModel: params.sortModel,
        },
        {
          minDelay: 300,
          maxDelay: 800,
          useCursorPagination: false,
        },
        columnsWithDefaultColDef,
      );

      return {
        slice: serverRows.returnedRows.slice(
          params.firstRowToRender,
          params.lastRowToRender,
        ),
        total: serverRows.returnedRows.length,
      };
    },
    [dataServerSide],
  );


  React.useEffect(() => {
    if (dataServerSide.length === 0) {
      return;
    }

    (async () => {
      const { slice, total } = await fetchRow({
        firstRowToRender: 0,
        lastRowToRender: 10,
        sortModel: [],
        filterModel: {
          items: [],
        },
      });

      setInitialRows(slice);
      setRowCount(total);
    })();
  }, [dataServerSide, fetchRow]);

  const handleFetchRows = React.useCallback(
    async (params) => {
      const { slice, total } = await fetchRow(params);

      apiRef.current.unstable_replaceRows(params.firstRowToRender, slice);
      setRowCount(total);
    },
    [apiRef, fetchRow],
  );

  const debouncedHandleFetchRows = React.useMemo(
    () => debounce(handleFetchRows, 200),
    [handleFetchRows],
  );

  return (
    <div style={{ height: 400, width: '100%' }}>
      <DataGridPro
        columns={columns}
        rows={initialRows}
        apiRef={apiRef}
        hideFooterPagination
        rowCount={rowCount}
        sortingMode="server"
        filterMode="server"
        rowsLoadingMode="server"
        onFetchRows={debouncedHandleFetchRows}
        experimentalFeatures={{
          lazyLoading: true,
        }}
      />
    </div>
  );
}
