import { SelectAppearance } from "./ui/select-appearance";

export default function DirectoryFilterBar() {
  return (
    <div className="w-full mb-12 py-2 bg-qellow">
      <div className="w-3/4 max-w-maxw px-container ml-auto text-lg font-[600] tracking-tight">
        Show 
        <SelectAppearance>  
          <select>
            <option value="all">all of the companies</option>
            <option value="10">Market Research Companies</option>
            <option value="20">Field Agencies</option>
            <option value="30">Recruitment Agencies</option>
          </select> 
        </SelectAppearance>
          proficient in 
        <SelectAppearance>  
          <select>
            <option value="all">all of the  quals sectors</option>
            <option value="10">the automotive sector</option>
            <option value="20">catering and hospitality</option>
            <option value="30">chemicals</option>
          </select> 
        </SelectAppearance>
          from 
        <SelectAppearance>  
          <select>
            <option value="all">all over the world</option>
            <option value="us">United States</option>
            <option value="uk">United Kingdom</option>
            <option value="de">Germany</option>
            <option value="fr">France</option>
            <option value="in">India</option>
            <option value="cn">China</option>
            <option value="jp">Japan</option>
            <option value="au">Australia</option>
            {/* Add more countries as needed */}
          </select>
        </SelectAppearance>
      </div>
    </div>
  )
}